import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { findTopKSimilar } from '@/lib/search';
import { answerQuestionGrounded } from '@/lib/ai';

export async function POST(req: Request) {
  const auth = await authorizeRequest(['ADMIN', 'ANALYST', 'VIEWER']);
  if (!auth.authorized || !auth.session) return auth.response;

  const workspaceId = auth.session.user.workspaceId;

  try {
    const body = await req.json();
    const question = body.question;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // 1. Fetch all workspace feedback and vectors
    const feedbackItems = await prisma.feedback.findMany({
      where: { workspaceId },
      select: {
        id: true,
        content: true,
        channel: true,
        sentiment: true,
        embedding: { select: { vector: true } },
      },
    });

    if (feedbackItems.length === 0) {
      return NextResponse.json({
        answer: "No customer feedback entries exist in your workspace yet. Ingest feedback to ask questions.",
        citedFeedback: [],
      });
    }

    // Map embeddings
    const embeddingsMap = new Map<string, number[]>();
    feedbackItems.forEach((item) => {
      if (item.embedding && item.embedding.vector) {
        try {
          embeddingsMap.set(item.id, JSON.parse(item.embedding.vector));
        } catch (e) {
          // ignore invalid json
        }
      }
    });

    // 2. Retrieve top-K relevant feedback items via vector similarity
    const topMatches = findTopKSimilar(
      question,
      feedbackItems.map((f) => ({ id: f.id, content: f.content })),
      embeddingsMap,
      5
    );

    const contextItems = topMatches.map((match) => {
      const original = feedbackItems.find((f) => f.id === match.item.id)!;
      return {
        id: original.id,
        content: original.content,
        channel: original.channel,
        sentiment: original.sentiment as any,
        relevanceScore: Number(match.score.toFixed(2)),
      };
    });

    // 3. Generate Grounded AI Answer using Claude (AI3)
    const groundedResult = await answerQuestionGrounded(question, contextItems);

    return NextResponse.json(groundedResult);
  } catch (error: any) {
    console.error('Ask LOOP error:', error);
    return NextResponse.json({ error: 'Failed to answer question' }, { status: 500 });
  }
}

