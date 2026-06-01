"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus, Webhook, Pencil, Archive, Pause, Play,
  RotateCcw, Copy, Eye, EyeOff, Loader2, Zap, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  createAutomation,
  updateAutomation,
  toggleAutomationStatus,
  rotateWebhookSecret,
  archiveAutomation,
} from "@/actions/admin/automations";

const AUTOMATION_TYPES = [
  { value: "lead_capture", label: "Captura de leads" },
  { value: "lead_scoring", label: "Calificación de leads" },
  { value: "appointment", label: "Gestión de citas" },
  { value: "follow_up", label: "Seguimiento" },
  { value: "notification", label: "Notificaciones" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "custom", label: "Personalizado" },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200",
  ERROR: "bg-red-50 text-red-700 border-red-200",
  ARCHIVED: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  ERROR: "Error",
  ARCHIVED: "Archivada",
};

export type AutomationRow = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  n8nWorkflowId: string | null;
  webhookSecret: string;
  organizationId: string;
  createdAt: Date;
  organization: { name: string; slug: string };
  _count: { events: number };
};

export type OrgOption = { id: string; name: string };

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }
  return { copied, copy };
}

function CopyButton({ text, copyKey, label }: { text: string; copyKey: string; label?: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      onClick={() => copy(text, copyKey)}
      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-brand-600 transition-colors"
      title="Copiar"
    >
      {copied === copyKey ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {label && <span>{copied === copyKey ? "Copiado" : label}</span>}
    </button>
  );
}

function CodeBlock({ value, copyKey }: { value: string; copyKey: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="relative">
      <pre className="bg-slate-950 text-slate-100 rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
        {value}
      </pre>
      <button
        onClick={() => copy(value, copyKey)}
        className="absolute top-2 right-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        title="Copiar"
      >
        {copied === copyKey ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}

// ─── Webhook Info Dialog ──────────────────────────────────────────────────────

function WebhookInfoDialog({
  automation,
  open,
  onClose,
}: {
  automation: AutomationRow;
  open: boolean;
  onClose: () => void;
}) {
  const [secretVisible, setSecretVisible] = useState(false);
  const [currentSecret, setCurrentSecret] = useState(automation.webhookSecret);
  const [rotating, startRotate] = useTransition();

  const endpoint =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/n8n/automations`
      : "/api/webhooks/n8n/automations";

  const exampleStart = JSON.stringify(
    {
      automationId: automation.id,
      event: "START",
      data: { triggeredBy: "n8n", workflowId: automation.n8nWorkflowId ?? "YOUR_WORKFLOW_ID" },
    },
    null,
    2
  );

  const exampleSuccess = JSON.stringify(
    {
      automationId: automation.id,
      event: "SUCCESS",
      data: { duration: 1230, result: { leadsProcessed: 5 } },
    },
    null,
    2
  );

  const curlExample = `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "x-reymen-orgid: ${automation.organizationId}" \\
  -H "x-reymen-secret: ${currentSecret}" \\
  -d '{"automationId":"${automation.id}","event":"SUCCESS","data":{}}'`;

  function handleRotate() {
    startRotate(async () => {
      try {
        const res = await rotateWebhookSecret(automation.id);
        setCurrentSecret(res.secret);
        toast.success("Secreto regenerado. Actualiza tu workflow en n8n.");
      } catch {
        toast.error("Error al regenerar el secreto");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-brand-600" />
            Configuración Webhook — {automation.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* Endpoint */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Endpoint URL</Label>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <code className="flex-1 text-xs text-slate-800 break-all">{endpoint}</code>
              <CopyButton text={endpoint} copyKey="endpoint" label="Copiar" />
            </div>
          </div>

          {/* Headers */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Headers requeridos</Label>
            <div className="rounded-md border border-slate-200 divide-y divide-slate-100">
              <div className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <code className="text-xs font-medium text-slate-700">x-reymen-orgid</code>
                  <p className="text-xs text-slate-400 mt-0.5 break-all">{automation.organizationId}</p>
                </div>
                <CopyButton text={automation.organizationId} copyKey="orgid" label="Copiar" />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 gap-3">
                <div className="min-w-0 flex-1">
                  <code className="text-xs font-medium text-slate-700">x-reymen-secret</code>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono break-all">
                    {secretVisible ? currentSecret : "•".repeat(20)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSecretVisible((v) => !v)}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                    title={secretVisible ? "Ocultar" : "Mostrar"}
                  >
                    {secretVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <CopyButton text={currentSecret} copyKey="secret" label="Copiar" />
                  <button
                    onClick={handleRotate}
                    disabled={rotating}
                    className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50"
                    title="Regenerar secreto"
                  >
                    {rotating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                    <span>Rotar</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <code className="text-xs font-medium text-slate-700">Content-Type</code>
                  <p className="text-xs text-slate-400 mt-0.5">application/json</p>
                </div>
                <CopyButton text="application/json" copyKey="ct" label="Copiar" />
              </div>
            </div>
          </div>

          {/* Automation ID */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Automation ID</Label>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <code className="flex-1 text-xs text-slate-800">{automation.id}</code>
              <CopyButton text={automation.id} copyKey="autoid" label="Copiar" />
            </div>
          </div>

          {/* n8n setup guide */}
          <div className="rounded-md border border-brand-200 bg-brand-50 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-brand-700">Configuración en n8n</p>
            <ol className="text-xs text-brand-700 space-y-1 list-decimal list-inside">
              <li>Agrega un nodo <strong>HTTP Request</strong> al final de tu workflow</li>
              <li>Método: <code className="bg-brand-100 px-1 rounded">POST</code> · URL: copia el endpoint de arriba</li>
              <li>En <strong>Headers</strong> agrega <code className="bg-brand-100 px-1 rounded">x-reymen-orgid</code> y <code className="bg-brand-100 px-1 rounded">x-reymen-secret</code></li>
              <li>En <strong>Body</strong> elige JSON y pega el payload de ejemplo</li>
              <li>Usa <code className="bg-brand-100 px-1 rounded">{"{{$node['NombreNodo'].json}}"}</code> para incluir datos dinámicos en <code>data</code></li>
            </ol>
          </div>

          {/* Payloads */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payloads de ejemplo</Label>
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Inicio del workflow (START)</p>
              <CodeBlock value={exampleStart} copyKey="pl-start" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Ejecución exitosa (SUCCESS)</p>
              <CodeBlock value={exampleSuccess} copyKey="pl-success" />
            </div>
          </div>

          {/* curl */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ejemplo cURL</Label>
            <CodeBlock value={curlExample} copyKey="curl" />
          </div>

          {/* Events field values */}
          <div className="text-xs text-slate-500 bg-slate-50 rounded-md p-3">
            <p className="font-medium text-slate-700 mb-1">Valores válidos para <code>event</code></p>
            <div className="flex flex-wrap gap-2">
              {["START", "SUCCESS", "FAILED", "RETRYING"].map((e) => (
                <code key={e} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-xs">{e}</code>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Dialog ────────────────────────────────────────────────────────────

function CreateAutomationDialog({
  orgs,
  open,
  onClose,
}: {
  orgs: OrgOption[];
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ organizationId: "", name: "", type: "", description: "", n8nWorkflowId: "" });
  const [pending, startCreate] = useTransition();

  function handleClose() {
    setForm({ organizationId: "", name: "", type: "", description: "", n8nWorkflowId: "" });
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.organizationId || !form.name || !form.type) {
      toast.error("Completa los campos requeridos");
      return;
    }
    startCreate(async () => {
      try {
        await createAutomation({
          organizationId: form.organizationId,
          name: form.name,
          type: form.type,
          description: form.description || undefined,
          n8nWorkflowId: form.n8nWorkflowId || undefined,
        });
        toast.success("Automatización creada");
        handleClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al crear");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva automatización</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={form.organizationId} onValueChange={(v) => setForm((f) => ({ ...f, organizationId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              placeholder="Captura leads WhatsApp"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {AUTOMATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input
              placeholder="Descripción opcional"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>ID Workflow n8n</Label>
            <Input
              placeholder="n8n workflow ID (opcional)"
              value={form.n8nWorkflowId}
              onChange={(e) => setForm((f) => ({ ...f, n8nWorkflowId: e.target.value }))}
            />
            <p className="text-xs text-slate-400">Puedes encontrarlo en la URL del workflow en n8n</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear automatización
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

function EditAutomationDialog({
  automation,
  open,
  onClose,
}: {
  automation: AutomationRow;
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: automation.name,
    type: automation.type,
    description: automation.description ?? "",
    n8nWorkflowId: automation.n8nWorkflowId ?? "",
    status: automation.status,
  });
  const [pending, startUpdate] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startUpdate(async () => {
      try {
        await updateAutomation(automation.id, {
          name: form.name,
          type: form.type,
          description: form.description || undefined,
          n8nWorkflowId: form.n8nWorkflowId,
          status: form.status,
        });
        toast.success("Automatización actualizada");
        onClose();
      } catch {
        toast.error("Error al actualizar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar automatización</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUTOMATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>ID Workflow n8n</Label>
            <Input
              value={form.n8nWorkflowId}
              onChange={(e) => setForm((f) => ({ ...f, n8nWorkflowId: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Activa</SelectItem>
                <SelectItem value="PAUSED">Pausada</SelectItem>
                <SelectItem value="ARCHIVED">Archivada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AutomationsManager({
  automations,
  orgs,
}: {
  automations: AutomationRow[];
  orgs: OrgOption[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AutomationRow | null>(null);
  const [webhookTarget, setWebhookTarget] = useState<AutomationRow | null>(null);
  const [togglePending, startToggle] = useTransition();
  const [archivePending, startArchive] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  const activeCount = automations.filter((a) => a.status === "ACTIVE").length;
  const errorCount = automations.filter((a) => a.status === "ERROR").length;

  function handleToggle(id: string) {
    setActionId(id);
    startToggle(async () => {
      try {
        const res = await toggleAutomationStatus(id);
        toast.success(`Automatización ${res.status === "ACTIVE" ? "activada" : "pausada"}`);
      } catch {
        toast.error("Error al cambiar estado");
      } finally {
        setActionId(null);
      }
    });
  }

  function handleArchive(id: string, name: string) {
    if (!confirm(`¿Archivar "${name}"? No podrá recibir nuevos eventos.`)) return;
    setActionId(id);
    startArchive(async () => {
      try {
        await archiveAutomation(id);
        toast.success("Automatización archivada");
      } catch {
        toast.error("Error al archivar");
      } finally {
        setActionId(null);
      }
    });
  }

  const typeLabel = (type: string) =>
    AUTOMATION_TYPES.find((t) => t.value === type)?.label ?? type;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Automatizaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {automations.length} total · {activeCount} activas
            {errorCount > 0 && <span className="text-red-500"> · {errorCount} con error</span>}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva automatización
        </Button>
      </div>

      {/* Table */}
      {automations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Sin automatizaciones aún</p>
            <Button className="mt-4" variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Crear primera automatización
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Automatización</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Eventos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Creado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {automations.map((auto) => {
                const isWorking = actionId === auto.id;
                return (
                  <tr key={auto.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{auto.name}</p>
                      {auto.description && (
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{auto.description}</p>
                      )}
                      {auto.n8nWorkflowId && (
                        <p className="text-xs text-slate-300 font-mono truncate max-w-[200px]">
                          n8n: {auto.n8nWorkflowId}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{auto.organization.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">{typeLabel(auto.type)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{auto._count.events}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[auto.status] ?? STATUS_COLORS.ARCHIVED}`}
                      >
                        {STATUS_LABELS[auto.status] ?? auto.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(auto.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Webhook info */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => setWebhookTarget(auto)}
                          title="Ver configuración webhook"
                        >
                          <Webhook className="h-3 w-3" />
                          <span className="hidden lg:inline">Webhook</span>
                        </Button>

                        {/* Edit */}
                        {auto.status !== "ARCHIVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => setEditTarget(auto)}
                            title="Editar"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}

                        {/* Toggle active/paused */}
                        {(auto.status === "ACTIVE" || auto.status === "PAUSED") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => handleToggle(auto.id)}
                            disabled={isWorking && (togglePending || archivePending)}
                            title={auto.status === "ACTIVE" ? "Pausar" : "Activar"}
                          >
                            {isWorking && togglePending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : auto.status === "ACTIVE" ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                        )}

                        {/* Archive */}
                        {auto.status !== "ARCHIVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-slate-400 hover:text-red-500 hover:border-red-300"
                            onClick={() => handleArchive(auto.id, auto.name)}
                            disabled={isWorking && archivePending}
                            title="Archivar"
                          >
                            {isWorking && archivePending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Archive className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      <CreateAutomationDialog orgs={orgs} open={createOpen} onClose={() => setCreateOpen(false)} />
      {editTarget && (
        <EditAutomationDialog
          automation={editTarget}
          open={true}
          onClose={() => setEditTarget(null)}
        />
      )}
      {webhookTarget && (
        <WebhookInfoDialog
          automation={webhookTarget}
          open={true}
          onClose={() => setWebhookTarget(null)}
        />
      )}
    </>
  );
}
