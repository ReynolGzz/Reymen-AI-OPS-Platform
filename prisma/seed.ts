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

  // ─── Phase 2: WhatsApp Assistant ─────────────────────────────────
  await prisma.whatsAppAssistant.upsert({
    where: { organizationId: demoOrg.id },
    update: {},
    create: {
      organizationId: demoOrg.id,
      name: "Dr. Bot — Asistente Clínica San Rafael",
      greeting: "¡Hola! Soy el asistente virtual de Clínica San Rafael. Puedo ayudarte a agendar citas, resolver dudas sobre nuestros servicios y más. ¿En qué puedo ayudarte hoy?",
      personality: "Soy amable, profesional y empático. Me enfoco en entender las necesidades del paciente y ofrecer soluciones rápidas. Siempre me dirijo al paciente por su nombre cuando lo conozco.",
      capabilities: ["appointments", "faq", "lead_capture", "follow_up", "escalation"],
      isActive: true,
      phoneNumber: "+52 55 1234 0000",
    },
  });
  console.log("✅ WhatsApp assistant created");

  // ─── Phase 2: Knowledge Base ──────────────────────────────────────
  const kbArticles = [
    {
      title: "Horarios de atención",
      content: "Clínica San Rafael atiende de lunes a viernes de 8:00am a 8:00pm, y sábados de 9:00am a 2:00pm. Los domingos y días festivos permanecemos cerrados.",
      category: "general",
      tags: ["horario", "atención"],
    },
    {
      title: "Especialidades médicas disponibles",
      content: "Contamos con las siguientes especialidades: Medicina General, Pediatría, Ginecología, Cardiología, Dermatología, Nutrición, Psicología y Odontología.",
      category: "servicios",
      tags: ["especialidades", "médicos"],
    },
    {
      title: "Cómo agendar una cita",
      content: "Puedes agendar tu cita por WhatsApp con nuestro asistente virtual, llamando al 55 1234 0000, o visitando nuestra clínica directamente. Las citas de urgencia se atienden el mismo día.",
      category: "citas",
      tags: ["citas", "agenda"],
    },
    {
      title: "Costos de consulta",
      content: "Consulta de medicina general: $500 MXN. Especialidades: $700-900 MXN según especialidad. Aceptamos efectivo, tarjeta y transferencia. También manejamos seguros médicos principales.",
      category: "precios",
      tags: ["costos", "precios", "seguros"],
    },
    {
      title: "Preparación para análisis de laboratorio",
      content: "Para análisis de sangre en ayuno: no consumir alimentos 8-12 horas antes. Solo agua es permitida. Para análisis generales sin ayuno puedes llegar a cualquier hora. Nuestro laboratorio abre de 7am a 5pm.",
      category: "servicios",
      tags: ["laboratorio", "análisis"],
    },
  ];

  for (const article of kbArticles) {
    await prisma.knowledgeBase.create({
      data: { ...article, organizationId: demoOrg.id },
    });
  }
  console.log("✅ Knowledge base articles created");

  // ─── Phase 2: Prompts ─────────────────────────────────────────────
  await prisma.prompt.create({
    data: {
      organizationId: demoOrg.id,
      name: "Sistema v1 — Clínica San Rafael",
      type: "SYSTEM",
      isActive: true,
      content: `Eres el asistente virtual de Clínica San Rafael, una clínica médica de prestigio en Ciudad de México.

Tu nombre es "Dr. Bot" y tu objetivo es:
1. Agendar citas médicas de forma rápida y eficiente
2. Responder preguntas sobre servicios, horarios y precios
3. Capturar datos de leads interesados en nuestros servicios
4. Escalar a un agente humano cuando el paciente lo solicite o la situación lo requiera

REGLAS IMPORTANTES:
- Siempre sé amable, empático y profesional
- No proporciones diagnósticos médicos bajo ninguna circunstancia
- Si el paciente menciona una emergencia, proporciona de inmediato el número de emergencias: 55 1234 0000
- Cuando no tengas información sobre algo, ofrece escalar con un humano
- Responde siempre en español`,
    },
  });

  await prisma.prompt.create({
    data: {
      organizationId: demoOrg.id,
      name: "Calificación de leads v1",
      type: "LEAD_QUALIFICATION",
      isActive: true,
      content: `Para calificar a un lead, obtén la siguiente información:
1. Nombre completo
2. Número de teléfono de contacto
3. Especialidad o tipo de consulta que necesita
4. Disponibilidad de horario preferida
5. Si tiene seguro médico (opcional)

Una vez obtenidos estos datos, confirma la información y ofrece agendar la cita.`,
    },
  });
  console.log("✅ Demo prompts created");

  // ─── Phase 2: AI scored lead ──────────────────────────────────────
  await prisma.lead.updateMany({
    where: { organizationId: demoOrg.id, name: "Roberto Sánchez" },
    data: {
      score: 87,
      scoreReason: "Empresa grande (>50 empleados), presupuesto disponible, decisor confirmado, timeline de 30 días.",
    },
  });

  await prisma.lead.updateMany({
    where: { organizationId: demoOrg.id, name: "María García" },
    data: { score: 62, scoreReason: "Interés genuino, presupuesto no confirmado, necesita consultar con familia." },
  });
  console.log("✅ Lead scores updated");

  // ─── Phase 2: Escalated conversation ─────────────────────────────
  await prisma.conversation.create({
    data: {
      organizationId: demoOrg.id,
      channel: "whatsapp",
      contactPhone: "+52 55 9876 0001",
      contactName: "Pedro Ortiz",
      status: "ESCALATED",
      aiHandled: false,
      escalatedAt: new Date(),
      messages: {
        create: [
          { role: "USER", content: "Necesito hablar urgentemente con alguien de la clínica" },
          { role: "ASSISTANT", content: "Entiendo que tienes una situación urgente. ¿Puedes contarme más para poder ayudarte mejor?" },
          { role: "USER", content: "Es por mi hijo, tuvo una reacción alérgica y necesito orientación médica" },
          { role: "ASSISTANT", content: "Por la urgencia de la situación, estoy transfiriendo esta conversación a un agente de nuestra clínica. Por favor mantén la comunicación activa." },
          { role: "SYSTEM", content: "Conversación escalada al equipo humano por urgencia médica." },
        ],
      },
    },
  });
  console.log("✅ Escalated conversation created");

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
