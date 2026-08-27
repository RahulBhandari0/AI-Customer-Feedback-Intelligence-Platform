import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { DEMO_WORKSPACES, DEMO_USERS, generateFullSeedDataset } from '../lib/seed-data'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🚀 Seeding comprehensive multi-tenant dataset (125+ items & RBAC users)...')

  // 1. Create / Upsert Workspaces
  const acmeWorkspace = await prisma.workspace.upsert({
    where: { slug: 'acme-corp' },
    update: { name: 'Acme Corp' },
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
    },
  })

  const betaWorkspace = await prisma.workspace.upsert({
    where: { slug: 'beta-labs' },
    update: { name: 'Beta Labs' },
    create: {
      name: 'Beta Labs',
      slug: 'beta-labs',
    },
  })

  console.log(`✅ Workspaces ready: Acme Corp (${acmeWorkspace.id}) & Beta Labs (${betaWorkspace.id})`)

  // 2. Create / Upsert Demo RBAC Users for Acme Corp
  const createdUsers: Record<string, string> = {}
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
    })
    createdUsers[u.role] = user.id

    // Ensure Workspace Membership
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
    })
  }

  console.log('✅ RBAC Users configured: Admin, Analyst, and Viewer')

  // 3. Clear existing feedback for Acme Corp to prevent unbounded duplication on re-seed
  await prisma.feedback.deleteMany({
    where: { workspaceId: acmeWorkspace.id },
  })

  // 4. Generate and Insert 125+ Seed Feedback items for Acme Corp
  const rawDataset = generateFullSeedDataset()
  const now = Date.now()

  const feedbackData = rawDataset.map((item) => {
    const createdDate = new Date(now - item.daysAgo * 24 * 60 * 60 * 1000)
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
      userId: createdUsers['ADMIN'],
    }
  })

  // Insert in batches
  await prisma.feedback.createMany({
    data: feedbackData,
  })

  console.log(`✅ Successfully seeded ${feedbackData.length} realistic feedback records for Acme Corp`)

  // 5. Seed 3 isolated records for Beta Labs (to demonstrate tenant isolation)
  await prisma.feedback.deleteMany({
    where: { workspaceId: betaWorkspace.id },
  })

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
  })

  console.log('✅ Beta Labs tenant isolation feedback seeded.')
  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })