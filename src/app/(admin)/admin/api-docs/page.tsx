import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Webhook } from "lucide-react";

const ENDPOINTS = [
  {
    method: "POST",
    path: "/api/webhooks/n8n/leads",
    description: "Crea un nuevo lead desde n8n. Requiere firma HMAC-SHA256 en el header X-Webhook-Signature.",
    body: JSON.stringify(
      { organizationId: "org_xxx", name: "Juan García", email: "juan@email.com", phone: "+52 55 1234 5678", source: "whatsapp", notes: "Interesado en consulta general" },
      null, 2
    ),
  },
  {
    method: "POST",
    path: "/api/webhooks/n8n/automations",
    description: "Registra un evento de ejecución de automatización. Status: SUCCESS | FAILED | PENDING.",
    body: JSON.stringify(
      { automationId: "auto_xxx", organizationId: "org_xxx", type: "lead_captured", status: "SUCCESS", duration: 843, errorMessage: null },
      null, 2
    ),
  },
  {
    method: "POST",
    path: "/api/webhooks/n8n/conversations",
    description: "Crea o continúa una conversación de WhatsApp. Si el contactPhone ya existe con status OPEN, agrega el mensaje a esa conversación.",
    body: JSON.stringify(
      { organizationId: "org_xxx", contactPhone: "+52 55 1234 5678", contactName: "María López", message: "Hola, quisiera una cita", role: "USER", channel: "whatsapp" },
      null, 2
    ),
  },
  {
    method: "POST",
    path: "/api/webhooks/n8n/scoring",
    description: "Actualiza el score de un lead con el resultado del scoring de IA. Score entre 0 y 100.",
    body: JSON.stringify(
      { organizationId: "org_xxx", leadId: "lead_xxx", score: 87, reason: "Empresa grande, presupuesto confirmado, decisor." },
      null, 2
    ),
  },
  {
    method: "GET",
    path: "/api/v1/knowledge-base",
    description: "Retorna artículos de la base de conocimiento. Autenticación: header X-Api-Key. Parámetros: ?q=búsqueda&category=categoria.",
    body: null,
  },
];

const AUTH_HEADER = `X-Webhook-Signature: sha256=<hmac_sha256(secret, body)>
Content-Type: application/json`;

export default function ApiDocsPage() {
  return (
    <div>
      <PageHeader
        title="Documentación de API"
        description="Referencia de webhooks y endpoints disponibles para n8n"
      />

      {/* Auth info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Autenticación de Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Todos los webhooks de n8n deben incluir una firma HMAC-SHA256 del body en el header{" "}
            <code className="rounded bg-slate-100 px-1 font-mono text-xs">X-Webhook-Signature</code>.
            El secret se obtiene de la variable de entorno{" "}
            <code className="rounded bg-slate-100 px-1 font-mono text-xs">WEBHOOK_SECRET</code>.
          </p>
          <pre className="rounded-lg bg-slate-950 p-4 text-xs text-slate-300 overflow-x-auto">
            <code>{AUTH_HEADER}</code>
          </pre>
          <p className="text-sm text-slate-600">
            Para la API de Knowledge Base, usa el header{" "}
            <code className="rounded bg-slate-100 px-1 font-mono text-xs">X-Api-Key: {"<KNOWLEDGE_BASE_API_KEY>"}</code>.
          </p>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <div className="space-y-4">
        {ENDPOINTS.map((ep) => (
          <Card key={ep.path}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <Badge
                  variant={ep.method === "GET" ? "info" : "success"}
                  className="font-mono text-xs px-2"
                >
                  {ep.method}
                </Badge>
                <code className="text-sm font-mono text-slate-700">{ep.path}</code>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">{ep.description}</p>
              {ep.body && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Code className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500">Request body (JSON)</span>
                  </div>
                  <pre className="rounded-lg bg-slate-950 p-4 text-xs text-slate-300 overflow-x-auto">
                    <code>{ep.body}</code>
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="p-5">
          <p className="text-sm text-slate-600">
            <span className="font-medium">Base URL de desarrollo:</span>{" "}
            <code className="rounded bg-slate-100 px-1 font-mono text-xs">http://localhost:3000</code>
          </p>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-medium">Base URL de producción:</span>{" "}
            configurada en la variable de entorno{" "}
            <code className="rounded bg-slate-100 px-1 font-mono text-xs">NEXTAUTH_URL</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
