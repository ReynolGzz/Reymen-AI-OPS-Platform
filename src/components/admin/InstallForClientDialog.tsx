"use client";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { installTemplateForClient } from "@/actions/admin/templates";

interface Client {
  id: string;
  name: string;
}

interface Version {
  id: string;
  version: string;
  isLatest: boolean;
}

interface InstallForClientDialogProps {
  templateId: string;
  templateName: string;
  clients: Client[];
  versions: Version[];
}

export function InstallForClientDialog({
  templateId,
  templateName,
  clients,
  versions,
}: InstallForClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedVersion, setSelectedVersion] = useState(
    versions.find((v) => v.isLatest)?.id ?? versions[0]?.id ?? ""
  );

  async function handleInstall() {
    if (!selectedOrg || !selectedVersion) {
      toast.error("Selecciona un cliente y una versión");
      return;
    }
    setLoading(true);
    try {
      await installTemplateForClient(selectedOrg, templateId, selectedVersion);
      toast.success(`Template instalado para el cliente`);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al instalar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Download className="h-4 w-4" />
          Instalar para cliente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Instalar: {templateName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Versión</Label>
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    v{v.version} {v.isLatest ? "— última" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleInstall} disabled={loading || !selectedOrg}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Instalar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
