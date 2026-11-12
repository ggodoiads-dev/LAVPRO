import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getSession } from "@/lib/auth/session";

// A camada autenticada depende de cookies e da sessão, portanto nunca
// deve ser pré-renderizada em build time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const perfil = session.activeMembership?.perfil ?? "proprietario";

  return (
    <div className="flex min-h-screen">
      <Sidebar perfil={perfil} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-x-hidden bg-muted/20 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
