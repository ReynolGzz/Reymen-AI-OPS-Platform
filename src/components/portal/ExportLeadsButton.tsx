"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportLeadsButton() {
  function handleExport() {
    window.location.href = "/api/portal/leads/export";
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  );
}
