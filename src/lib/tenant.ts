import { prisma } from "./prisma";

export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({
    where: { slug, isActive: true },
  });
}

export async function getOrganizationById(id: string) {
  return prisma.organization.findUnique({
    where: { id, isActive: true },
  });
}

export function assertOrgAccess(
  sessionOrgId: string | null | undefined,
  resourceOrgId: string
): void {
  if (!sessionOrgId || sessionOrgId !== resourceOrgId) {
    throw new Error("Access denied: organization mismatch");
  }
}
