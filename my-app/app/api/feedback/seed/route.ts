import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateFullSeedDataset, DEMO_USERS } from '@/lib/seed-data';

export async function POST() {
  try {
    // 1. Ensure default Acme Corp workspace exists
    const acmeWorkspace = await prisma.workspace.upsert({
      where: { slug: 'acme-corp' },
      update: { name: 'Acme Corp' },
      create: {
        name: 'Acme Corp',
        slug: 'acme-corp',
      },
    });

    const betaWorkspace = await prisma.workspace.upsert({
      where: { slug: 'beta-labs' },
      update: { name: 'Beta Labs' },
      create: {
        name: 'Beta Labs',
        slug: 'beta-labs',
      },
    });

    // 2. Ensure RBAC demo users exist
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@acme.com' },
      update: { name: 'Admin User', role: 'ADMIN' },
      create: {
        email: 'admin@acme.com',
        name: 'Admin User',
        role: 'ADMIN',
        clerkUserId: 'demo-admin-acme',
      },
    });

    for (const u of DEMO_USERS) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, role: u.role },
        create: {
          email: u.email,
          name: u.name,
          role: u.role,
          clerkUserId: u.clerkUserId,
        },
      });

      await prisma.workspaceMember.upsert({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId: acmeWorkspace.id,
          },
        },
        update: { role: u.role },
        create: {
          userId: user.id,
          workspaceId: acmeWorkspace.id,
          role: u.role,
        },
      });
    }

    // 3. Clear existing items for Acme Corp and re-populate full dataset
    await prisma.feedback.deleteMany({
      where: { workspaceId: acmeWorkspace.id },
    });

    const rawDataset = generateFullSeedDataset();
    const now = Date.now();

    const feedbackData = rawDataset.map((item) => {
      const createdDate = new Date(now - item.daysAgo * 24 * 60 * 60 * 1000);
      return {
        content: item.content,
        source: item.source,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        category: item.category,
        urgency: item.urgency,
        status: item.status,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        summary: item.summary,
        tags: item.tags,
        createdAt: createdDate,
        workspaceId: acmeWorkspace.id,
        userId: adminUser.id,
      };
    });

    await prisma.feedback.createMany({
      data: feedbackData,
    });

    // Seed Beta Labs isolated tenant data
    await prisma.feedback.deleteMany({
      where: { workspaceId: betaWorkspace.id },
    });

    await prisma.feedback.createMany({
      data: [
        {
          content: 'Beta Labs isolated customer feedback: Testing quantum neural network pipeline.',
          source: 'Email',
          sentiment: 'Positive',
          sentimentScore: 0.85,
          category: 'Performance',
          urgency: 'Low',
          status: 'NEW',
          customerName: 'Beta Client',
          customerEmail: 'client@betalabs.internal',
          summary: 'Quantum pipeline testing feedback.',
          tags: ['beta-labs', 'isolated-tenant'],
          workspaceId: betaWorkspace.id,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${feedbackData.length} items across Acme Corp & Beta Labs`,
      count: feedbackData.length,
      workspace: acmeWorkspace.name,
    });
  } catch (error: unknown) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed sample feedback data' },
      { status: 500 }
    );
  }
}
