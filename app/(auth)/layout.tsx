import Link from "next/link";
import { BrandLogo } from "@/components/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex gradient-brand text-white">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_20%_20%,rgba(255,255,255,0.12),transparent)]" />
        <Link href="/" className="relative">
          <BrandLogo size="md" variant="light" />
        </Link>
        <div className="relative max-w-md">
          <blockquote className="text-2xl font-medium leading-relaxed">
            “Com o LAVPRO reduzimos em 40% o tempo de recepção e passamos
            a saber, em tempo real, quantos veículos estão em cada box.”
          </blockquote>
          <div className="mt-4 text-sm text-white/80">
            Equipe de operações · Lava-Jato referência
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
