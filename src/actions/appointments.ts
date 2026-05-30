"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { AppointmentStatus } from "@prisma/client";

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

export async function createAppointment(data: z.infer<typeof createSchema>) {
  const session = await auth();
  if (!session?.user.organizationId) throw new Error("No autorizado");

  const parsed = createSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");

  const start = new Date(parsed.data.startTime);
  const end = new Date(parsed.data.endTime);
  if (end <= start) throw new Error("La hora de fin debe ser posterior a la de inicio");

  await prisma.appointment.create({
    data: {
      organizationId: session.user.organizationId,
      title: parsed.data.title,
      description: parsed.data.description,
      startTime: start,
      endTime: end,
      source: "manual",
    },
  });

  revalidatePath("/portal/appointments");
  return { success: true };
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const session = await auth();
  if (!session?.user.organizationId) throw new Error("No autorizado");

  const apt = await prisma.appointment.findFirst({
    where: { id: appointmentId, organizationId: session.user.organizationId },
  });
  if (!apt) throw new Error("Cita no encontrada");

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
  });

  revalidatePath("/portal/appointments");
  return { success: true };
}
