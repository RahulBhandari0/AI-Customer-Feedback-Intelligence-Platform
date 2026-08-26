import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return new NextResponse("Workspace name is required", { status: 400 });
    }

    // Slug generation
    const slug = name.toLowerCase().replace(/ /g, "-") + "-" + Date.now();

    // Ensure User exists in local DB
    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          clerkUserId: userId,
          email: `${userId}@placeholder.com`, // Sync with Clerk email if available
        },
      });
    }

    // Create Workspace & assign ADMIN role (RBAC)
    const workspace = await db.workspace.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
      },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("[WORKSPACE_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}