import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { feedbacks, workspaceId } = await req.json();

    if (!workspaceId || !Array.isArray(feedbacks) || feedbacks.length === 0) {
      return NextResponse.json(
        { error: "Workspace ID and valid feedback items are required" },
        { status: 400 }
      );
    }

    // Database user check (clerkUserId field handle kar ke)
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { clerkUserId: userId }],
      },
    });

    if (!dbUser) {
      const email = user.emailAddresses[0]?.emailAddress || `${userId}@example.com`;
      dbUser = await prisma.user.create({
        data: {
          clerkUserId: userId,
          email: email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
        },
      });
    }

    const dataToInsert = feedbacks.map((item: any) => {
      const feedbackText = item.title || item.description || item.text || item.content || "No Feedback";
      const extraDesc = item.description && item.title ? ` - ${item.description}` : "";

      return {
        content: `${feedbackText}${extraDesc}`,
        source: "CSV",
        workspaceId: workspaceId,
        userId: dbUser.id,
      };
    });

    const result = await prisma.feedback.createMany({
      data: dataToInsert as any[],
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (err: any) {
    console.error("Bulk upload error details:", err);
    return NextResponse.json(
      { error: "Failed to upload feedback batch", details: err?.message },
      { status: 500 }
    );
  }
}