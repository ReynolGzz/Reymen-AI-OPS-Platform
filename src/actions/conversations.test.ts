// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTestOrg, createTestUser, fakeSession, cleanupOrg } from "@/test/helpers";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue({ sent: true }) }));
const { sendEmail } = await import("@/lib/email");
const { escalateConversation, resolveConversation } = await import("./conversations");

describe("conversations actions", () => {
  let org: { id: string };
  let owner: { id: string };
  let admin: { id: string; email: string };

  beforeAll(async () => {
    org = await createTestOrg("Conversations Test Org");
    owner = await createTestUser(org.id, "OWNER", "conv-owner");
    admin = await createTestUser(null, "SUPER_ADMIN", "conv-admin");
  });

  beforeEach(() => {
    (sendEmail as ReturnType<typeof vi.fn>).mockClear();
  });

  afterAll(async () => {
    await cleanupOrg(org.id);
    await prisma.user.delete({ where: { id: admin.id } });
  });

  it("escalates an open conversation and notifies admins by email", async () => {
    authMock.mockResolvedValue(fakeSession({ id: owner.id, role: "OWNER", organizationId: org.id }));

    const conv = await prisma.conversation.create({
      data: { organizationId: org.id, channel: "whatsapp", contactName: "Ana García" },
    });

    const result = await escalateConversation(conv.id);
    expect(result.success).toBe(true);

    const updated = await prisma.conversation.findUniqueOrThrow({ where: { id: conv.id } });
    expect(updated.status).toBe("ESCALATED");
    expect(updated.escalatedAt).not.toBeNull();

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: admin.email,
        subject: expect.stringContaining("escalada"),
        html: expect.stringContaining("Ana García"),
      })
    );
  });

  it("rejects escalating a conversation that isn't OPEN", async () => {
    authMock.mockResolvedValue(fakeSession({ id: owner.id, role: "OWNER", organizationId: org.id }));
    const conv = await prisma.conversation.create({
      data: { organizationId: org.id, channel: "whatsapp", status: "RESOLVED" },
    });

    await expect(escalateConversation(conv.id)).rejects.toThrow(/abiertas/i);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("resolves a conversation without sending an admin notification", async () => {
    authMock.mockResolvedValue(fakeSession({ id: owner.id, role: "OWNER", organizationId: org.id }));
    const conv = await prisma.conversation.create({
      data: { organizationId: org.id, channel: "whatsapp", status: "ESCALATED" },
    });

    const result = await resolveConversation(conv.id);
    expect(result.success).toBe(true);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
