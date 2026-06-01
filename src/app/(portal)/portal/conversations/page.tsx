import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getServerT } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

export default async function PortalConversationsPage() {
  const session = await auth();
  if (!session?.user.organizationId) return redirect("/login");

  const [t, conversations] = await Promise.all([
    getServerT(),
    prisma.conversation.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={t.conversationsTitle}
        description={`${conversations.length} ${t.conversationsCount}`}
      />

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={MessageSquare}
              title={t.noConversations}
              description={t.conversationsEmptyDesc}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t.colContact}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t.colChannel}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t.colMessages}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t.colStatus}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">{t.colLastActivity}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/portal/conversations/${conv.id}`} className="hover:underline">
                      <p className="font-medium text-slate-900">{conv.contactName ?? t.unknown}</p>
                      {conv.contactPhone && <p className="text-xs text-slate-400">{conv.contactPhone}</p>}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{conv.channel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{conv._count.messages}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={conv.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(conv.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
