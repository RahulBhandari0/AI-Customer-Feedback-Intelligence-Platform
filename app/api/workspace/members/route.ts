import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

export async function GET() {
  const auth = await authorizeRequest(['ADMIN', 'ANALYST', 'VIEWER']);
  if (!auth.authorized || !auth.session) return auth.response;

  const workspaceId = auth.session.user.workspaceId;

  const members = await prisma.user.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ members });
}

export async function PATCH(req: Request) {
  // Only ADMIN can change member roles (C2 RBAC rule)
  const auth = await authorizeRequest(['ADMIN']);
  if (!auth.authorized || !auth.session) return auth.response;

  const workspaceId = auth.session.user.workspaceId;

  try {
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role || !['ADMIN', 'ANALYST', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Valid userId and role are required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: userId, workspaceId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found in this workspace' }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ message: 'Role updated successfully', user: updated });
  } catch (error: any) {
    console.error('Member update error:', error);
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
  }
}

