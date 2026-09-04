<<<<<<< HEAD
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    let whereClause = {};
    if (workspaceId && workspaceId !== "undefined") {
      whereClause = { workspaceId };
    }

    const feedbacks = await prisma.feedback.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(feedbacks);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch feedbacks", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, workspaceId } = body;

    if (!title && !description) {
      return NextResponse.json(
        { message: "Missing required feedback content" },
        { status: 400 }
      );
    }

    // Verify workspace exists in DB or fallback to default workspace
    let dbWorkspace = null;
    if (workspaceId && workspaceId !== "undefined") {
      dbWorkspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
    }

    if (!dbWorkspace) {
      dbWorkspace = await prisma.workspace.findFirst();
      if (!dbWorkspace) {
        dbWorkspace = await prisma.workspace.create({
          data: {
            name: "Acme Corp Workspace",
            slug: "acme-corp",
          },
        });
      }
    }

    // Attempt to identify current authenticated user via Clerk
    let dbUser = null;
    try {
      const { userId } = await auth();
      if (userId) {
        dbUser = await prisma.user.findFirst({
          where: {
            OR: [{ id: userId }, { clerkUserId: userId }],
          },
        });

        if (!dbUser) {
          const user = await currentUser();
          const email = user?.emailAddresses[0]?.emailAddress || `${userId}@example.com`;
          const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";
          dbUser = await prisma.user.create({
            data: {
              clerkUserId: userId,
              email,
              name,
            },
          });
        }
      }
    } catch {
      // Auth check failed or unauthenticated request
    }

    // Fallback user if not logged in or auth is omitted
    if (!dbUser) {
      dbUser = await prisma.user.findFirst();
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            clerkUserId: "default_user",
            email: "user@example.com",
            name: "Default User",
          },
        });
      }
    }

    const contentText = title && description && title !== description 
      ? `${title}: ${description}` 
      : (description || title);

    const newFeedback = await prisma.feedback.create({
      data: {
        content: contentText,
        source: "IN_APP",
        workspaceId: dbWorkspace.id,
        userId: dbUser.id,
      },
    });

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error: any) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { message: "Failed to create feedback", error: error.message },
      { status: 500 }
    );
  }
}

=======
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeFeedbackWithAI } from '@/lib/ai';
import {
  getWorkspaceContext,
  canIngestFeedback,
  canTriageFeedback,
  canDeleteFeedback,
  forbiddenResponse,
} from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);
    const { searchParams } = new URL(req.url);

    const sentiment = searchParams.get('sentiment');
    const category = searchParams.get('category');
    const source = searchParams.get('source');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateRange = searchParams.get('dateRange'); // '7d', '30d', '90d', 'all'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));

    // Multi-tenant isolation: strictly filter by active workspace
    const whereClause: Record<string, unknown> = {
      workspaceId: context.workspaceId,
    };

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

    // Compute live stats scoped strictly to the current workspace
    const workspaceScope = { workspaceId: context.workspaceId };
    const totalCount = await prisma.feedback.count({ where: workspaceScope });
    const positiveCount = await prisma.feedback.count({ where: { ...workspaceScope, sentiment: 'Positive' } });
    const neutralCount = await prisma.feedback.count({ where: { ...workspaceScope, sentiment: 'Neutral' } });
    const negativeCount = await prisma.feedback.count({ where: { ...workspaceScope, sentiment: 'Negative' } });
    const highUrgencyCount = await prisma.feedback.count({ where: { ...workspaceScope, urgency: 'High', status: { not: 'ACTIONED' } } });

    return NextResponse.json({
      success: true,
      feedbacks,
      feedback: feedbacks,
      context: {
        workspaceId: context.workspaceId,
        workspaceName: context.workspaceName,
        workspaceSlug: context.workspaceSlug,
        userRole: context.userRole,
        userName: context.userName,
        userEmail: context.userEmail,
      },
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
    const context = await getWorkspaceContext(req);

    // RBAC Check: Viewers are read-only
    if (!canIngestFeedback(context.userRole)) {
      return forbiddenResponse('Viewer role is read-only. Ingestion is restricted to Admins and Analysts.');
    }

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
        status: 'NEW', // NEW -> REVIEWED -> ACTIONED
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        workspaceId: context.workspaceId,
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
    const context = await getWorkspaceContext(req);

    // RBAC Check: Viewers cannot triage or update feedback
    if (!canTriageFeedback(context.userRole)) {
      return forbiddenResponse('Viewer role is read-only. Updating triage status is restricted to Admins and Analysts.');
    }

    const body = await req.json();
    const { id, status, category, urgency } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    // Ensure item belongs to the caller's workspace
    const existing = await prisma.feedback.findFirst({
      where: { id, workspaceId: context.workspaceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Feedback item not found in this workspace' },
        { status: 404 }
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
    const context = await getWorkspaceContext(req);

    // RBAC Check: Only Admins can permanently delete feedback items
    if (!canDeleteFeedback(context.userRole)) {
      return forbiddenResponse('Only Admins are permitted to delete feedback items.');
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    // Ensure item belongs to the caller's workspace
    const existing = await prisma.feedback.findFirst({
      where: { id, workspaceId: context.workspaceId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Feedback item not found in this workspace' },
        { status: 404 }
      );
    }

    await prisma.feedback.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
}
>>>>>>> origin/feedback
