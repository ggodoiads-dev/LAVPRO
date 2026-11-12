import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listCampanhas } from "@/lib/data/queries";
import { CampanhaForm } from "@/components/forms/campanha-form";

export const metadata = { title: "Editar campanha" };

export default async function EditarCampanhaPage({
  params,
}: {
  params: { id: string };
}) {
  const campanhas = await listCampanhas();
  const campanha = campanhas.find((c) => c.id === params.id);
  if (!campanha) notFound();

  return (
    <div>
      <PageHeader
        title={`Campanha · ${campanha.nome}`}
        description="Ajuste gatilho, canal, template e parâmetros."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/inteligencia">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <CampanhaForm campanha={campanha} />
        </CardContent>
      </Card>
    </div>
  );
}
