import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { classifyFeedback } from '@/lib/ai';
import { FeedbackStatus, Sentiment } from '@prisma/client';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeRequest(['ADMIN', 'ANALYST']);
  if (!auth.authorized || !auth.session) return auth.response;

  const workspaceId = auth.session.user.workspaceId;
  const feedbackId = params.id;

  try {
    const existing = await prisma.feedback.findFirst({
      where: { id: feedbackId, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Feedback item not found in workspace' }, { status: 404 });
    }

    const body = await req.json();

    // 1. Status Update Workflow (C4)
    if (body.status) {
      const validStatuses = ['NEW', 'REVIEWED', 'ACTIONED'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }

      const updated = await prisma.feedback.update({
        where: { id: feedbackId },
        data: { status: body.status as FeedbackStatus },
        include: {
          themes: { include: { theme: true } },
        },
      });

      return NextResponse.json({ message: 'Status updated', item: updated });
    }

    // 2. Manual Re-classify Action (AI1)
    if (body.reclassify) {
      const existingThemes = await prisma.theme.findMany({
        where: { workspaceId },
        select: { id: true, name: true },
      });

      const classification = await classifyFeedback(
        existing.content,
        existingThemes.map((t) => t.name)
      );

      // Reset themes for this item
      await prisma.feedbackTheme.deleteMany({
        where: { feedbackId },
      });

      const updated = await prisma.feedback.update({
        where: { id: feedbackId },
        data: {
          sentiment: classification.sentiment as Sentiment,
          sentimentScore: classification.sentimentScore,
          featureArea: classification.featureArea,
        },
        include: {
          themes: { include: { theme: true } },
        },
      });

      for (const themeName of classification.themes) {
        let themeObj = existingThemes.find((t) => t.name.toLowerCase() === themeName.toLowerCase());
        if (!themeObj) {
          themeObj = await prisma.theme.create({
            data: {
              name: themeName,
              description: `Theme for ${classification.featureArea}`,
              workspaceId,
            },
          });
        }

        await prisma.feedbackTheme.create({
          data: {
            feedbackId: feedbackId,
            themeId: themeObj.id,
            confidence: 0.9,
          },
        });
      }

      const reclassifiedItem = await prisma.feedback.findUnique({
        where: { id: feedbackId },
        include: {
          themes: { include: { theme: true } },
        },
      });

      return NextResponse.json({ message: 'Re-classification complete', item: reclassifiedItem });
    }

    return NextResponse.json({ error: 'No valid action provided' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Failed to update feedback item' }, { status: 500 });
  }
}

