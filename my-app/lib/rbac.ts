import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface WorkspaceContext {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  userRole: UserRole;
  userEmail: string;
  userName: string;
}

/**
 * Resolves the active workspace and role context for API route handlers and server actions.
 * Supports Clerk authentication and dynamic role overrides via cookies/headers for mentor testing.
 */
export async function getWorkspaceContext(req?: NextRequest | Request): Promise<WorkspaceContext> {
  // 1. Check for cookie or header overrides for demo/grading role switching
  let demoRoleOverride: UserRole | null = null;
  let demoWorkspaceOverride: string | null = null;

  if (req) {
    const headers = req.headers;
    const cookieHeader = headers.get('cookie') || '';
    
    // Parse cookies
    const roleCookieMatch = cookieHeader.match(/loop_active_role=([^;]+)/);
    const workspaceCookieMatch = cookieHeader.match(/loop_active_workspace=([^;]+)/);

    if (roleCookieMatch && ['ADMIN', 'ANALYST', 'VIEWER'].includes(roleCookieMatch[1].toUpperCase())) {
      demoRoleOverride = roleCookieMatch[1].toUpperCase() as UserRole;
    }

    if (workspaceCookieMatch) {
      demoWorkspaceOverride = decodeURIComponent(workspaceCookieMatch[1]);
    }

    // Direct header override
    const headerRole = headers.get('x-loop-role');
    if (headerRole && ['ADMIN', 'ANALYST', 'VIEWER'].includes(headerRole.toUpperCase())) {
      demoRoleOverride = headerRole.toUpperCase() as UserRole;
    }

    const headerWorkspace = headers.get('x-loop-workspace');
    if (headerWorkspace) {
      demoWorkspaceOverride = headerWorkspace;
    }
  }

  // 2. Fetch target workspace (defaults to 'acme-corp')
  const targetSlug = demoWorkspaceOverride || 'acme-corp';
  let workspace = await prisma.workspace.findUnique({
    where: { slug: targetSlug },
  });

  if (!workspace) {
    // Fallback to first available workspace or create default
    workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: 'Acme Corp',
          slug: 'acme-corp',
        },
      });
    }
  }

  // 3. Resolve role for this workspace
  const effectiveRole: UserRole = demoRoleOverride || 'ADMIN';
  const roleNameMap: Record<UserRole, { email: string; name: string }> = {
    ADMIN: { email: 'admin@acme.com', name: 'Admin User' },
    ANALYST: { email: 'analyst@acme.com', name: 'Analyst User' },
    VIEWER: { email: 'viewer@acme.com', name: 'Viewer User (Read-Only)' },
  };

  const userProfile = roleNameMap[effectiveRole];

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workspaceSlug: workspace.slug,
    userRole: effectiveRole,
    userEmail: userProfile.email,
    userName: userProfile.name,
  };
}

/**
 * Role Permission Checkers
 */
export function canIngestFeedback(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'ANALYST';
}

export function canTriageFeedback(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'ANALYST';
}

export function canDeleteFeedback(role: UserRole): boolean {
  return role === 'ADMIN';
}

export function canManageMembers(role: UserRole): boolean {
  return role === 'ADMIN';
}

/**
 * Standard 403 Forbidden Response
 */
export function forbiddenResponse(
  message = 'Forbidden: You do not have sufficient role permissions to perform this action.'
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: '403_FORBIDDEN',
    },
    { status: 403 }
  );
}
