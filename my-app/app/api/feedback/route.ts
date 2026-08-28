import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Single workspace ke SAARI feedbacks retrieve karein (chahe user dwara ho ya Ingestion Bot dwara)
    const feedbacks = await prisma.feedback.findMany({
      where: {
        workspaceId: workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(feedbacks);
  } catch (err: any) {
    console.error("Fetch feedbacks error:", err);
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 }
    );
  }
}