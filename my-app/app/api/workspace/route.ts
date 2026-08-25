import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Clean singleton import

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name, slug } = await req.json();

    if (!name || !slug) {
      return new NextResponse('Name and slug are required', { status: 400 });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        members: {
          create: {
            role: 'ADMIN',
            user: {
              connectOrCreate: {
                where: { clerkUserId: userId },
                create: {
                  clerkUserId: userId,
                  email: `user_${userId}@example.com`,
                },
              },
            },
          },
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('[WORKSPACE_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}