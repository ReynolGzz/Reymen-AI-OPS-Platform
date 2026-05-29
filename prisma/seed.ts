import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHmac } from "crypto";

const prisma = new PrismaClient();

function generateWebhookSecret(): string {
  return createHmac("sha256", Math.random().toString())
    .update(Date.now().toString())
    .digest("hex");
}

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Reymen Admin User ────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@reymen.io" },
    update: {},
    create: {
      email: "admin@reymen.io",
      name: "Reymen Admin",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ─── Demo Client Organization ─────────────────────────────────────
  const clientPassword = await bcrypt.hash("client123456", 12);
  const demoOrg = await prisma.organization.upsert({
    where: { slug: "clinica-san-rafael" },
    update: {},
    create: {
      name: "Clínica San Rafael",
      slug: "clinica-san-rafael",
      industry: "clinic",
      plan: "starter",
      users: {
        create: {
          name: "Dr. Carlos Ramírez",
          email: "carlos@clinicasanrafael.com",
          passwordHash: clientPassword,
          role: "OWNER",
        },
      },
    },
    include: { users: true },
  });
  console.log(`✅ Demo org: ${demoOrg.name}`);

  // ─── Automations ──────────────────────────────────────────────────
  const automation1 = await prisma.automation.upsert({
    where: { id: "auto-demo-1" },
    update: {},
    create: {
      id: "auto-demo-1",
      organizationId: demoOrg.id,
      name: "Captura de leads - WhatsApp",
      description: "Captura automática de leads desde WhatsApp Business",
      type: "lead_capture",
      status: "ACTIVE",
      n8nWorkflowId: "wf-001",
      webhookSecret: generateWebhookSecret(),
    },
  });

  const automation2 = await prisma.automation.upsert({
    where: { id: "auto-demo-2" },
    update: {},
    create: {
      id: "auto-demo-2",
      organizationId: demoOrg.id,
      name: "Agenda de citas automática",
      description: "Agendamiento inteligente de citas médicas",
      type: "appointment",
      status: "ACTIVE",
      n8nWorkflowId: "wf-002",
      webhookSecret: generateWebhookSecret(),
    },
  });
  console.log("✅ Demo automations created");

  // ─── Automation Events ────────────────────────────────────────────
  for (let i = 0; i < 8; i++) {
    await prisma.automationEvent.create({
      data: {
        automationId: automation1.id,
        organizationId: demoOrg.id,
        type: "lead_captured",
        status: i % 5 === 0 ? "FAILED" : "SUCCESS",
        duration: Math.floor(Math.random() * 2000) + 200,
        errorMessage: i % 5 === 0 ? "WhatsApp API timeout" : null,
      },
    });
  }
  console.log("✅ Demo automation events created");

  // ─── Sample Leads ─────────────────────────────────────────────────
  const leads = [
    { name: "María García", email: "maria@gmail.com", phone: "+52 55 1234 5678", source: "whatsapp", status: "NEW" as const },
    { name: "Juan López", email: "juan@hotmail.com", phone: "+52 55 9876 5432", source: "web", status: "CONTACTED" as const },
    { name: "Ana Martínez", phone: "+52 55 5555 4444", source: "whatsapp", status: "QUALIFIED" as const },
    { name: "Roberto Sánchez", email: "roberto@empresa.com", source: "referral", status: "PROPOSAL" as const },
    { name: "Laura Torres", email: "laura@gmail.com", phone: "+52 55 3333 2222", source: "whatsapp", status: "WON" as const },
    { name: "Diego Flores", phone: "+52 55 7777 8888", source: "whatsapp", status: "NEW" as const },
  ];

  for (const lead of leads) {
    await prisma.lead.create({
      data: { ...lead, organizationId: demoOrg.id },
    });
  }
  console.log("✅ Demo leads created");

  // ─── Sample Conversations ─────────────────────────────────────────
  const conv = await prisma.conversation.create({
    data: {
      organizationId: demoOrg.id,
      channel: "whatsapp",
      contactPhone: "+52 55 1234 5678",
      contactName: "María García",
      status: "OPEN",
      messages: {
        create: [
          { role: "USER", content: "Hola, quisiera hacer una cita para consulta general" },
          { role: "ASSISTANT", content: "¡Hola! Con gusto te ayudo. ¿Tienes disponibilidad esta semana?" },
          { role: "USER", content: "Sí, el miércoles por la tarde" },
          { role: "ASSISTANT", content: "Perfecto. Tenemos disponibilidad el miércoles a las 3pm y 5pm. ¿Cuál prefieres?" },
        ],
      },
    },
  });
  console.log("✅ Demo conversations created");

  // ─── Sample Appointments ──────────────────────────────────────────
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1);

  await prisma.appointment.create({
    data: {
      organizationId: demoOrg.id,
      title: "Consulta general - María García",
      startTime: new Date(baseDate.setHours(15, 0, 0, 0)),
      endTime: new Date(baseDate.setHours(15, 30, 0, 0)),
      status: "CONFIRMED",
      source: "ai",
    },
  });

  await prisma.appointment.create({
    data: {
      organizationId: demoOrg.id,
      title: "Revisión médica - Juan López",
      startTime: new Date(new Date().setDate(new Date().getDate() + 3)),
      endTime: new Date(new Date().setDate(new Date().getDate() + 3)),
      status: "SCHEDULED",
      source: "ai",
    },
  });
  console.log("✅ Demo appointments created");

  // ─── Sample Requests ──────────────────────────────────────────────
  await prisma.request.create({
    data: {
      organizationId: demoOrg.id,
      title: "Integrar con sistema HIS del hospital",
      description: "Necesitamos que la automatización de citas se sincronice con nuestro sistema hospitalario interno. El sistema usa API REST.",
      type: "new_automation",
      status: "OPEN",
      priority: "high",
    },
  });

  await prisma.request.create({
    data: {
      organizationId: demoOrg.id,
      title: "El bot no responde después de las 10pm",
      description: "Los pacientes reportan que el asistente de WhatsApp no responde pasadas las 10pm. Necesitamos que funcione 24/7.",
      type: "support",
      status: "IN_PROGRESS",
      priority: "high",
    },
  });
  console.log("✅ Demo requests created");

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Demo credentials:");
  console.log("  Admin → admin@reymen.io / admin123456");
  console.log("  Client → carlos@clinicasanrafael.com / client123456");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
