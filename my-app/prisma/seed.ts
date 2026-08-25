import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding initial data...')

  // Create Initial Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@feedback.com' },
    update: {},
    create: {
      email: 'admin@feedback.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  // Create Sample Feedback
  await prisma.feedback.createMany({
    data: [
      {
        content: 'Great dashboard layout, but loading speed needs improvement.',
        source: 'Survey',
        sentiment: 'Neutral',
        category: 'Performance',
        userId: admin.id,
      },
      {
        content: 'Love the dark mode feature! Works seamlessly.',
        source: 'Email',
        sentiment: 'Positive',
        category: 'Feature Request',
        userId: admin.id,
      },
    ],
  })

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })