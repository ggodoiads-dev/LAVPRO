import { notFound } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/brand";
import { getTenantPublic } from "@/lib/data/public";
import { BookForm } from "./book-form";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const { tenant } = await getTenantPublic(params.slug);
  return {
    title: tenant ? `Agende seu horário · ${tenant.nome}` : "Agendamento",
    robots: { index: false },
  };
}

export default async function BookPage({ params }: Props) {
  const { tenant, servicos } = await getTenantPublic(params.slug);
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
            Agende seu horário na {tenant.nome}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha o serviço, informe seu veículo e um horário desejado. A
            recepção confirma em instantes.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <BookForm slug={params.slug} servicos={servicos} />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Já cliente? Consulte o status pelo{" "}
          <Link
            className="font-medium text-secondary hover:underline"
            href={`/portal/${params.slug}`}
          >
            portal do cliente
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
