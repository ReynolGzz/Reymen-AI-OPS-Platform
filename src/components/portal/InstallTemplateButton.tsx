"use client";

import { useState } from "react";
import { Loader2, Download, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { installTemplate, uninstallTemplate } from "@/actions/templates";

interface InstallTemplateButtonProps {
  templateId: string;
  isInstalled: boolean;
}

export function InstallTemplateButton({ templateId, isInstalled: initialInstalled }: InstallTemplateButtonProps) {
  const [installed, setInstalled] = useState(initialInstalled);
  const [loading, setLoading] = useState(false);
  const [showUninstall, setShowUninstall] = useState(false);

  async function handleInstall() {
    setLoading(true);
    try {
      await installTemplate({ templateId });
      setInstalled(true);
      toast.success("Template instalado. La automatización ya está activa.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al instalar");
    } finally {
      setLoading(false);
    }
  }

  async function handleUninstall() {
    if (!confirm("¿Desinstalar este template? La automatización asociada será archivada.")) return;
    setLoading(true);
    try {
      await uninstallTemplate(templateId);
      setInstalled(false);
      setShowUninstall(false);
      toast.success("Template desinstalado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al desinstalar");
    } finally {
      setLoading(false);
    }
  }

  if (installed) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setShowUninstall(true)}
        onMouseLeave={() => setShowUninstall(false)}
      >
        {showUninstall ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUninstall}
            disabled={loading}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Desinstalar
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled className="text-emerald-600 border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-4 w-4" />
            Instalado
          </Button>
        )}
      </div>
    );
  }

  return (
    <Button size="sm" onClick={handleInstall} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Instalar
    </Button>
  );
}
