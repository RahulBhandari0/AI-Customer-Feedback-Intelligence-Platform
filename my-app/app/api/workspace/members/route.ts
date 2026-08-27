import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkspaceContext, canManageMembers, forbiddenResponse, UserRole } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);

    const workspace = await prisma.workspace.findUnique({
      where: { id: context.workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    const formattedMembers = workspace.members.map((m) => ({
      membershipId: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name || m.user.email.split('@')[0],
      role: m.role,
    }));

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
      currentRole: context.userRole,
      members: formattedMembers,
    });
  } catch (error: unknown) {
    console.error('Error fetching workspace members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);

    if (!canManageMembers(context.userRole)) {
      return forbiddenResponse('Only Admins can invite and add workspace members.');
    }

    const body = await req.json();
    const { email, name, role = 'VIEWER' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const validatedRole = (['ADMIN', 'ANALYST', 'VIEWER'].includes(role) ? role : 'VIEWER') as UserRole;

    // Connect or create user
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: name || undefined },
      create: {
        email,
        name: name || email.split('@')[0],
        role: validatedRole,
      },
    });

    // Add membership
    const membership = await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: context.workspaceId,
        },
      },
      update: { role: validatedRole },
      create: {
        userId: user.id,
        workspaceId: context.workspaceId,
        role: validatedRole,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Member ${email} added as ${validatedRole}`,
      member: {
        membershipId: membership.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        role: membership.role,
      },
    });
  } catch (error: unknown) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add workspace member' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);

    if (!canManageMembers(context.userRole)) {
      return forbiddenResponse('Only Admins are permitted to update member roles.');
    }

    const body = await req.json();
    const { membershipId, newRole } = body;

    if (!membershipId || !newRole || !['ADMIN', 'ANALYST', 'VIEWER'].includes(newRole)) {
      return NextResponse.json(
        { success: false, error: 'Valid membershipId and newRole (ADMIN, ANALYST, VIEWER) are required' },
        { status: 400 }
      );
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: membershipId },
      data: { role: newRole as UserRole },
    });

    return NextResponse.json({
      success: true,
      message: `Role updated to ${newRole}`,
      membership: updated,
    });
  } catch (error: unknown) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await getWorkspaceContext(req);

    if (!canManageMembers(context.userRole)) {
      return forbiddenResponse('Only Admins are permitted to remove members.');
    }

    const { searchParams } = new URL(req.url);
    const membershipId = searchParams.get('membershipId');

    if (!membershipId) {
      return NextResponse.json(
        { success: false, error: 'membershipId parameter is required' },
        { status: 400 }
      );
    }

    await prisma.workspaceMember.delete({
      where: { id: membershipId },
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed from workspace successfully',
    });
  } catch (error: unknown) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
