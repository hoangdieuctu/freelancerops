import { PrismaClient } from "../app/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbUrl = "file:" + path.resolve(process.cwd(), "prisma/dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Clean existing data
  await prisma.earning.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.member.deleteMany();

  // --- Members ---
  const alice = await prisma.member.create({
    data: { name: "Alice Chen", role: "Tech Lead", email: "alice@devstudio.io", isProfitMember: true },
  });
  const bob = await prisma.member.create({
    data: { name: "Bob Nguyen", role: "Full-Stack Developer", email: "bob@devstudio.io" },
  });
  const cara = await prisma.member.create({
    data: { name: "Cara Schmidt", role: "UI/UX Designer", email: "cara@devstudio.io" },
  });
  const dan = await prisma.member.create({
    data: { name: "Dan Patel", role: "Backend Developer", email: "dan@devstudio.io" },
  });

  // --- Team ---
  const team = await prisma.team.create({
    data: { name: "Dev Studio", description: "Core product and design team" },
  });

  // Add members to team with rates
  const tmAlice = await prisma.teamMember.create({
    data: { teamId: team.id, memberId: alice.id, internalRate: 120, clientRate: 150 },
  });
  const tmBob = await prisma.teamMember.create({
    data: { teamId: team.id, memberId: bob.id, internalRate: 80, clientRate: 110 },
  });
  const tmCara = await prisma.teamMember.create({
    data: { teamId: team.id, memberId: cara.id, internalRate: 70, clientRate: 100 },
  });
  // Dan is a shadow of Bob (backup)
  const tmDan = await prisma.teamMember.create({
    data: { teamId: team.id, memberId: dan.id, internalRate: 65, clientRate: 110, shadowOfId: tmBob.id },
  });

  // --- Customers ---
  const acme = await prisma.customer.create({
    data: {
      name: "Acme Corp",
      email: "billing@acme.com",
      address: "742 Evergreen Terrace\nSpringfield, IL 62701\nUSA",
    },
  });
  const nova = await prisma.customer.create({
    data: {
      name: "Nova Labs",
      email: "accounts@novalabs.io",
      address: "1 Infinite Loop\nCupertino, CA 95014\nUSA",
    },
  });

  // --- Projects ---
  const proj1 = await prisma.project.create({
    data: {
      name: "Acme Platform Redesign",
      description: "Full redesign of the customer portal and backend APIs",
      status: "active",
      customerId: acme.id,
      teamId: team.id,
    },
  });
  const proj2 = await prisma.project.create({
    data: {
      name: "Nova Analytics Dashboard",
      description: "Real-time data visualization dashboard",
      status: "completed",
      customerId: nova.id,
      teamId: team.id,
    },
  });
  const proj3 = await prisma.project.create({
    data: {
      name: "Internal Tooling",
      description: "Internal DevOps and automation tooling",
      status: "paused",
    },
  });

  // --- Invoices ---

  // Invoice 1 — paid, for Nova Analytics (proj2)
  const inv1 = await prisma.invoice.create({
    data: {
      number: "INV-001",
      projectId: proj2.id,
      status: "paid",
      invoiceDate: new Date("2025-11-01"),
      dueDate: new Date("2025-11-30"),
      taxPercent: 8,
      notes: "Phase 1 delivery — data ingestion pipeline and chart components.",
      lines: {
        create: [
          { teamMemberId: tmAlice.id, hoursSpent: 20, isFixed: false, clientRate: 150, subtotal: 3000, description: "Architecture & API design" },
          { teamMemberId: tmBob.id, hoursSpent: 40, isFixed: false, clientRate: 110, subtotal: 4400, description: "Backend integration" },
          { teamMemberId: tmDan.id, hoursSpent: 10, isFixed: false, clientRate: 110, subtotal: 1100, description: "Backend support (shadow)" },
          { teamMemberId: tmCara.id, hoursSpent: 30, isFixed: false, clientRate: 100, subtotal: 3000, description: "Dashboard UI design" },
        ],
      },
    },
    include: { lines: { include: { teamMember: true } } },
  });

  // Create earnings for INV-001 (simulate paid logic)
  // Shadow: Dan shadowed Bob for 10h → subtract from Bob's effective hours
  const danLine = inv1.lines.find(l => l.teamMemberId === tmDan.id)!;
  const bobLine = inv1.lines.find(l => l.teamMemberId === tmBob.id)!;
  const aliceLine = inv1.lines.find(l => l.teamMemberId === tmAlice.id)!;
  const caraLine = inv1.lines.find(l => l.teamMemberId === tmCara.id)!;

  // Bob effective: 40 - 10 = 30h @ $80
  await prisma.earning.createMany({
    data: [
      { memberId: alice.id, invoiceId: inv1.id, invoiceLineId: aliceLine.id, amount: 20 * 120 }, // 2400
      { memberId: bob.id, invoiceId: inv1.id, invoiceLineId: bobLine.id, amount: 30 * 80 },      // 2400 (effective)
      { memberId: dan.id, invoiceId: inv1.id, invoiceLineId: danLine.id, amount: 10 * 65 },      // 650 (shadow)
      { memberId: cara.id, invoiceId: inv1.id, invoiceLineId: caraLine.id, amount: 30 * 70 },    // 2100
    ],
  });
  // Margin for Alice (profit member): client hourly - internal
  // Client non-shadow hourly: alice(3000) + bob(4400) + cara(3000) = 10400
  // Internal: alice(2400) + bob_effective(2400) + dan(650) + cara(2100) = 7550
  const margin1 = 10400 - 7550; // 2850
  await prisma.earning.create({
    data: { memberId: alice.id, invoiceId: inv1.id, amount: margin1 },
  });

  // Invoice 2 — sent, for Acme (proj1)
  await prisma.invoice.create({
    data: {
      number: "INV-002",
      projectId: proj1.id,
      status: "sent",
      invoiceDate: new Date("2025-12-01"),
      dueDate: new Date("2025-12-31"),
      taxPercent: 10,
      notes: "Sprint 1 — authentication module and onboarding flow.",
      lines: {
        create: [
          { teamMemberId: tmAlice.id, hoursSpent: 15, isFixed: false, clientRate: 150, subtotal: 2250, description: "Tech lead & code review" },
          { teamMemberId: tmBob.id, hoursSpent: 35, isFixed: false, clientRate: 110, subtotal: 3850, description: "Auth module development" },
          { teamMemberId: tmCara.id, hoursSpent: 20, isFixed: false, clientRate: 100, subtotal: 2000, description: "Onboarding UI/UX" },
        ],
      },
    },
  });

  // Invoice 3 — draft, for Acme (proj1)
  await prisma.invoice.create({
    data: {
      number: "INV-003",
      projectId: proj1.id,
      status: "draft",
      invoiceDate: new Date("2026-01-15"),
      dueDate: new Date("2026-02-14"),
      notes: "Sprint 2 — dashboard and reporting features.",
      lines: {
        create: [
          { teamMemberId: tmAlice.id, hoursSpent: 10, isFixed: false, clientRate: 150, subtotal: 1500, description: "Architecture review" },
          { teamMemberId: tmBob.id, hoursSpent: 45, isFixed: false, clientRate: 110, subtotal: 4950, description: "Dashboard implementation" },
          { teamMemberId: tmCara.id, hoursSpent: 25, isFixed: false, clientRate: 100, subtotal: 2500, description: "Reporting UI design" },
          { teamMemberId: tmAlice.id, hoursSpent: 1, isFixed: true, clientRate: 500, subtotal: 500, description: "Project setup fee (fixed)" },
        ],
      },
    },
  });

  console.log("Seed complete.");
  console.log(`  Members: alice=${alice.id}, bob=${bob.id}, cara=${cara.id}, dan=${dan.id}`);
  console.log(`  Team: ${team.id}`);
  console.log(`  Customers: acme=${acme.id}, nova=${nova.id}`);
  console.log(`  Projects: ${proj1.id}, ${proj2.id}, ${proj3.id}`);
  console.log(`  Invoices: INV-001 (paid), INV-002 (sent), INV-003 (draft)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
