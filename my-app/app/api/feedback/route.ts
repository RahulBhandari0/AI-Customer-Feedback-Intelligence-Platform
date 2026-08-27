import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeFeedbackWithAI } from '@/lib/ai';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sentiment = searchParams.get('sentiment');
    const category = searchParams.get('category');
    const source = searchParams.get('source');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateRange = searchParams.get('dateRange'); // '7d', '30d', '90d', 'all'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '10', 10)));

    const whereClause: Record<string, unknown> = {};

    if (sentiment && sentiment !== 'ALL') {
      whereClause.sentiment = sentiment;
    }
    if (category && category !== 'ALL') {
      whereClause.category = category;
    }
    if (source && source !== 'ALL') {
      whereClause.source = source;
    }
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }
    if (search && search.trim() !== '') {
      whereClause.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dateRange && dateRange !== 'ALL') {
      const now = new Date();
      let fromDate: Date | null = null;
      if (dateRange === '7d') {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '30d') {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateRange === '90d') {
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
      if (fromDate) {
        whereClause.createdAt = { gte: fromDate };
      }
    }

    // Server-side pagination query
    const totalFiltered = await prisma.feedback.count({ where: whereClause });
    const feedbacks = await prisma.feedback.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Compute live stats for the workspace/filter
    const totalCount = await prisma.feedback.count();
    const positiveCount = await prisma.feedback.count({ where: { sentiment: 'Positive' } });
    const neutralCount = await prisma.feedback.count({ where: { sentiment: 'Neutral' } });
    const negativeCount = await prisma.feedback.count({ where: { sentiment: 'Negative' } });
    const highUrgencyCount = await prisma.feedback.count({ where: { urgency: 'High' } });

    return NextResponse.json({
      success: true,
      feedbacks,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      },
      stats: {
        total: totalCount,
        positive: positiveCount,
        neutral: neutralCount,
        negative: negativeCount,
        highUrgency: highUrgencyCount,
        positiveRatio: totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching feedbacks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback entries' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, source = 'Web Form', customerName, customerEmail } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Feedback content cannot be empty' },
        { status: 400 }
      );
    }

    // Run AI analysis
    const aiAnalysis = analyzeFeedbackWithAI(content);

    const feedback = await prisma.feedback.create({
      data: {
        content: content.trim(),
        source: source || 'Web Form',
        sentiment: aiAnalysis.sentiment,
        sentimentScore: aiAnalysis.sentimentScore,
        category: aiAnalysis.category,
        urgency: aiAnalysis.urgency,
        summary: aiAnalysis.summary,
        tags: aiAnalysis.tags,
        status: 'NEW', // Zidio Brief: NEW -> REVIEWED -> ACTIONED
        customerName: customerName || null,
        customerEmail: customerEmail || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        feedback,
        aiAnalysis,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, category, urgency } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
        ...(urgency ? { urgency } : {}),
      },
    });

    return NextResponse.json({ success: true, feedback: updated });
  } catch (error: unknown) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    await prisma.feedback.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Feedback deleted' });
  } catch (error: unknown) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
}
