import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { generateVoCReportNarrative } from '@/lib/ai';

export async function GET(req: Request) {
  const auth = await authorizeRequest(['ADMIN', 'ANALYST', 'VIEWER']);
  if (!auth.authorized || !auth.session) return auth.response;

  const workspaceId = auth.session.user.workspaceId;
  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get('id');

  if (reportId) {
    const report = await prisma.report.findFirst({
      where: { id: reportId, workspaceId },
      include: { generatedBy: { select: { name: true, email: true } } },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ report });
  }

  const reports = await prisma.report.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    include: { generatedBy: { select: { name: true } } },
  });

  return NextResponse.json({ reports });
}

export async function POST(req: Request) {
  const auth = await authorizeRequest(['ADMIN', 'ANALYST']);
  if (!auth.authorized || !auth.session) return auth.response;

  const workspaceId = auth.session.user.workspaceId;
  const userId = auth.session.user.id;

  try {
    const body = await req.json();
    const days = parseInt(body.days || '30', 10);
    const periodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const periodEnd = new Date();

    // Pre-compute workspace stats for period
    const items = await prisma.feedback.findMany({
      where: {
        workspaceId,
        createdAt: { gte: periodStart },
      },
      include: {
        themes: { include: { theme: true } },
      },
    });

    if (items.length === 0) {
      return NextResponse.json({ error: 'No feedback items found in selected period to generate report' }, { status: 400 });
    }

    const totalCount = items.length;
    const positiveCount = items.filter((i) => i.sentiment === 'POS').length;
    const neutralCount = items.filter((i) => i.sentiment === 'NEU').length;
    const negativeCount = items.filter((i) => i.sentiment === 'NEG').length;

    // Theme counts
    const themeCounts: Record<string, number> = {};
    items.forEach((item) => {
      item.themes.forEach((ft) => {
        themeCounts[ft.theme.name] = (themeCounts[ft.theme.name] || 0) + 1;
      });
    });

    const topThemes = Object.entries(themeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Notable verbatim quotes
    const verbatimQuotes = items
      .filter((i) => i.content.length > 20)
      .slice(0, 6)
      .map((i) => ({
        quote: i.content,
        channel: i.channel,
        sentiment: i.sentiment as any,
      }));

    // Generate narrative via AI4
    const reportContent = await generateVoCReportNarrative(`Last ${days} Days`, {
      totalCount,
      positiveCount,
      neutralCount,
      negativeCount,
      topThemes,
      verbatimQuotes,
    });

    const report = await prisma.report.create({
      data: {
        title: `Voice-of-Customer Report (${days} Days)`,
        periodStart,
        periodEnd,
        contentJson: JSON.stringify(reportContent),
        workspaceId,
        generatedById: userId,
      },
      include: { generatedBy: { select: { name: true } } },
    });

    return NextResponse.json({ message: 'Report generated', report }, { status: 201 });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate Voice-of-Customer report' }, { status: 500 });
  }
}

