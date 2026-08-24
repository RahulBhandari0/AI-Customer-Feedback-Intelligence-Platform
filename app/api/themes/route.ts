import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/rbac';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const auth = await authorizeRequest(['ADMIN', 'ANALYST', 'VIEWER']);
  if (!auth.authorized || !auth.session) return auth.response;

  const workspaceId = auth.session.user.workspaceId;
  const { searchParams } = new URL(req.url);
  const themeId = searchParams.get('themeId');

  // Drill-down into specific theme items if themeId requested
  if (themeId) {
    const theme = await prisma.theme.findFirst({
      where: { id: themeId, workspaceId },
    });

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
    }

    const items = await prisma.feedback.findMany({
      where: {
        workspaceId,
        themes: {
          some: { themeId },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ theme, items });
  }

  // Fetch all workspace themes with feedback counts and spike calculations
  const themes = await prisma.theme.findMany({
    where: { workspaceId },
    include: {
      feedbacks: {
        include: {
          feedback: {
            select: {
              id: true,
              sentiment: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const formattedThemes = themes.map((theme) => {
    const allFeedbacks = theme.feedbacks.map((f) => f.feedback);
    const count = allFeedbacks.length;

    // Period calculations for spike detection
    const currentPeriodCount = allFeedbacks.filter((f) => f.createdAt >= sevenDaysAgo).length;
    const previousPeriodCount = allFeedbacks.filter(
      (f) => f.createdAt >= fourteenDaysAgo && f.createdAt < sevenDaysAgo
    ).length;

    const delta = currentPeriodCount - previousPeriodCount;
    const isSpiking = currentPeriodCount >= 3 && (previousPeriodCount === 0 || currentPeriodCount / (previousPeriodCount || 1) >= 1.4);

    const posCount = allFeedbacks.filter((f) => f.sentiment === 'POS').length;
    const negCount = allFeedbacks.filter((f) => f.sentiment === 'NEG').length;
    const neuCount = allFeedbacks.filter((f) => f.sentiment === 'NEU').length;

    return {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      color: theme.color,
      count,
      currentPeriodCount,
      previousPeriodCount,
      delta,
      isSpiking,
      sentiments: {
        positive: posCount,
        negative: negCount,
        neutral: neuCount,
      },
    };
  });

  // Sort by count descending
  formattedThemes.sort((a, b) => b.count - a.count);

  return NextResponse.json({ themes: formattedThemes });
}

