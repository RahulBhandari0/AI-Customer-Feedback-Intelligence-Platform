import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { CreateFeedbackSchema } from '@/lib/types';
import { classifyFeedback } from '@/lib/ai';
import { generateSimpleEmbedding } from '@/lib/search';
import { Sentiment, FeedbackStatus } from '@prisma/client';

export async function GET(req: Request) {
  const auth = await authorizeRequest(['ADMIN', 'ANALYST', 'VIEWER']);
  if (!auth.authorized || !auth.session) return auth.response;

  const workspaceId = auth.session.user.workspaceId;
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '15', 10);
  const search = searchParams.get('search') || '';
  const channel = searchParams.get('channel') || '';
  const sentiment = searchParams.get('sentiment') || '';
  const status = searchParams.get('status') || '';
  const themeId = searchParams.get('themeId') || '';
  const days = searchParams.get('days') || '';

  const skip = (page - 1) * limit;

  // Build workspace-scoped filter object
  const where: any = {
    workspaceId,
  };

  if (search) {
    where.OR = [
      { content: { contains: search, mode: 'insensitive' } },
      { customerLabel: { contains: search, mode: 'insensitive' } },
      { featureArea: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (channel) where.channel = channel;
  if (sentiment) where.sentiment = sentiment as Sentiment;
  if (status) where.status = status as FeedbackStatus;

  if (days) {
    const daysInt = parseInt(days, 10);
    if (!isNaN(daysInt)) {
      where.createdAt = {
        gte: new Date(Date.now() - daysInt * 24 * 60 * 60 * 1000),
      };
    }
  }

  if (themeId) {
    where.themes = {
      some: {
        themeId,
      },
    };
  }

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        themes: {
          include: {
            theme: true,
          },
        },
      },
    }),
    prisma.feedback.count({ where }),
  ]);

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  // Only Admin or Analyst can create feedback (C2 RBAC rule)
  const auth = await authorizeRequest(['ADMIN', 'ANALYST']);
  if (!auth.authorized || !auth.session) return auth.response;

  const workspaceId = auth.session.user.workspaceId;

  try {
    const body = await req.json();
    const validated = CreateFeedbackSchema.parse(body);

    // Fetch workspace existing themes for AI classification context
    const existingThemes = await prisma.theme.findMany({
      where: { workspaceId },
      select: { name: true, id: true },
    });

    // 1. Run AI Auto-Classification (AI1)
    const classification = await classifyFeedback(
      validated.content,
      existingThemes.map((t) => t.name)
    );

    // 2. Create Feedback item
    const feedback = await prisma.feedback.create({
      data: {
        content: validated.content,
        channel: validated.channel,
        customerLabel: validated.customerLabel || `Customer #${Math.floor(Math.random() * 9000 + 1000)}`,
        sourceRef: validated.sourceRef || `MANUAL-${Date.now()}`,
        sentiment: classification.sentiment as Sentiment,
        sentimentScore: classification.sentimentScore,
        featureArea: classification.featureArea,
        status: FeedbackStatus.NEW,
        workspaceId,
      },
    });

    // 3. Connect/Create Themes
    for (const themeName of classification.themes) {
      let themeObj = existingThemes.find((t) => t.name.toLowerCase() === themeName.toLowerCase());
      if (!themeObj) {
        themeObj = await prisma.theme.create({
          data: {
            name: themeName,
            description: `Auto-generated theme for ${classification.featureArea}`,
            workspaceId,
          },
        });
      }

      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: themeObj.id,
          confidence: 0.9,
        },
      });
    }

    // 4. Create Embedding vector for Ask LOOP Q&A
    const vector = generateSimpleEmbedding(feedback.content);
    await prisma.embedding.create({
      data: {
        feedbackId: feedback.id,
        vector: JSON.stringify(vector),
      },
    });

    // Fetch final item with relations
    const createdItem = await prisma.feedback.findUnique({
      where: { id: feedback.id },
      include: {
        themes: {
          include: { theme: true },
        },
      },
    });

    return NextResponse.json({ message: 'Feedback created and classified', item: createdItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    return NextResponse.json({ error: error.message || 'Failed to create feedback' }, { status: 400 });
  }
}

