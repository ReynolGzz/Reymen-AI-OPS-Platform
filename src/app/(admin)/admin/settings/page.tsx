import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader title="Configuración" description="Configuración del sistema Reymen AI Ops" />
      <Card>
        <CardHeader>
          <CardTitle>Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Configuración adicional disponible en próximas versiones.</p>
        </CardContent>
      </Card>
    </div>
  );
}
