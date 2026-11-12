import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/brand";
import { getTenantPublic } from "@/lib/data/public";
import { PortalBuscaForm } from "./busca-form";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const { tenant } = await getTenantPublic(params.slug);
  return {
    title: tenant ? `Portal do cliente · ${tenant.nome}` : "Portal",
    robots: { index: false },
  };
}

export default async function PortalPage({ params }: Props) {
  const { tenant } = await getTenantPublic(params.slug);
  if (!tenant) notFound();
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo />
          </Link>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{tenant.nome}</span>
          </div>
        </div>
      </header>
      <main className="container max-w-3xl py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Portal do cliente
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Informe a placa do seu veículo e o telefone cadastrado para
            consultar agendamentos, histórico de serviços e saldo de pontos.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <PortalBuscaForm slug={params.slug} />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Novo por aqui?{" "}
          <Link
            href={`/book/${params.slug}`}
            className="font-medium text-secondary hover:underline"
          >
            Agendar primeiro horário
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
