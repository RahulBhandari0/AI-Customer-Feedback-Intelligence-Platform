import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "Acme Corp Workspace",
      slug: "acme-corp",
    },
  });

  // 2. Create Admin User using Relation Connect syntax
  const user = await prisma.user.create({
    data: {
      clerkUserId: "seed_admin_123",
      name: "Rahul Admin",
      email: "rahul@example.com",
      role: "ADMIN",
      workspace: {
        connect: { id: workspace.id },
      },
    },
  });

  // 3. Create Sample Feedbacks
  await prisma.feedback.createMany({
    data: [
      {
        content: "The dashboard loading speed is fantastic!",
        sentiment: "POSITIVE",
        source: "WEB",
        workspaceId: workspace.id,
        userId: user.id,
      },
      {
        content: "UI setting menu is a bit confusing.",
        sentiment: "NEGATIVE",
        source: "WEB",
        workspaceId: workspace.id,
        userId: user.id,
      },
    ],
  });

  console.log("Database seeded successfully with Workspace, User, and Feedback!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });