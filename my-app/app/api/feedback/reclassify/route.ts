import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeFeedbackWithAI } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID is required for re-classification' },
        { status: 400 }
      );
    }

    const existingFeedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { success: false, error: 'Feedback record not found' },
        { status: 404 }
      );
    }

    // Re-run AI analysis
    const aiAnalysis = analyzeFeedbackWithAI(existingFeedback.content);

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        sentiment: aiAnalysis.sentiment,
        sentimentScore: aiAnalysis.sentimentScore,
        category: aiAnalysis.category,
        urgency: aiAnalysis.urgency,
        summary: aiAnalysis.summary,
        tags: aiAnalysis.tags,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback re-classified successfully',
      feedback: updated,
      aiAnalysis,
    });
  } catch (error: unknown) {
    console.error('Error re-classifying feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to re-classify feedback' },
      { status: 500 }
    );
  }
}
