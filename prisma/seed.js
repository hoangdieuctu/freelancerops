const { PrismaClient } = require("../app/generated/prisma");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

async function main() {
  const dbUrl = "file:" + path.resolve(__dirname, "dev.db");
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  const prisma = new PrismaClient({ adapter });

  // Clean existing data
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.customer.deleteMany();

  // Teams
  const frontend = await prisma.team.create({
    data: {
      name: "Frontend Squad",
      description: "Specialises in React, Next.js, and design systems.",
      members: {
        create: [
          { name: "Mia Torres",    email: "mia@freelanceops.io",    role: "Lead Developer" },
          { name: "Jake Renn",     email: "jake@freelanceops.io",   role: "UI Engineer" },
          { name: "Priya Nair",    email: "priya@freelanceops.io",  role: "Designer" },
        ],
      },
    },
  });

  const backend = await prisma.team.create({
    data: {
      name: "Backend Collective",
      description: "Node.js, APIs, databases, and infrastructure.",
      members: {
        create: [
          { name: "Sam Okafor",    email: "sam@freelanceops.io",    role: "Backend Lead" },
          { name: "Lin Wei",       email: "lin@freelanceops.io",    role: "DevOps Engineer" },
          { name: "Carlos Reyes",  email: "carlos@freelanceops.io", role: "API Developer" },
        ],
      },
    },
  });

  const mobile = await prisma.team.create({
    data: {
      name: "Mobile Unit",
      description: "React Native and cross-platform mobile apps.",
      members: {
        create: [
          { name: "Anya Kowalski", email: "anya@freelanceops.io",   role: "Mobile Lead" },
          { name: "Tom Fischer",   email: "tom@freelanceops.io",    role: "iOS Developer" },
        ],
      },
    },
  });

  // Customers
  const acme = await prisma.customer.create({
    data: { name: "Rachel Simmons", address: "123 Market St, San Francisco, CA" },
  });

  const nova = await prisma.customer.create({
    data: { name: "David Park", address: "88 Design Ave, New York, NY" },
  });

  const hyper = await prisma.customer.create({
    data: { name: "Elena Vasquez", address: "500 Tech Blvd, Austin, TX" },
  });

  const solo = await prisma.customer.create({
    data: { name: "Marcus Webb" },
  });

  // Projects
  await prisma.project.create({
    data: {
      name: "Acme Dashboard Redesign",
      description: "Full redesign of the internal analytics dashboard. New design system, component library, and performance audit.",
      status: "active",
      deadline: new Date("2026-05-15"),
      teamId: frontend.id,
      customerId: acme.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Nova Studio API",
      description: "REST API for Nova's creative asset management platform. Auth, storage integrations, and webhooks.",
      status: "active",
      deadline: new Date("2026-04-30"),
      teamId: backend.id,
      customerId: nova.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Hyperscale Mobile App",
      description: "Cross-platform mobile app for field workers to log time and tasks in real-time.",
      status: "active",
      deadline: new Date("2026-06-01"),
      teamId: mobile.id,
      customerId: hyper.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Webb Portfolio Site",
      description: "Personal portfolio and blog for Marcus Webb. Custom CMS and animation-heavy landing page.",
      status: "completed",
      deadline: new Date("2026-02-28"),
      teamId: frontend.id,
      customerId: solo.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Acme Auth Service",
      description: "Standalone OAuth2 / SSO service to replace legacy auth across Acme's internal tools.",
      status: "paused",
      deadline: new Date("2026-07-01"),
      teamId: backend.id,
      customerId: acme.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Hyperscale Admin Panel",
      description: "Web-based admin dashboard for the Hyperscale mobile app backend.",
      status: "active",
      deadline: new Date("2026-05-20"),
      teamId: frontend.id,
      customerId: hyper.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Nova Design System",
      description: "Component library and Figma token pipeline for Nova Studio's product team.",
      status: "cancelled",
      customerId: nova.id,
    },
  });

  console.log("✓ Seed complete");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
