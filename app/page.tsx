import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Gauge,
  KanbanSquare,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard em tempo real",
    description:
      "Faturamento, ticket médio, ocupação, veículos em atendimento e produtividade — tudo com dados vivos do banco.",
  },
  {
    icon: KanbanSquare,
    title: "Kanban operacional",
    description:
      "Do recebimento à entrega. Cada veículo tem seu card, com tempo decorrido, status e responsável visíveis.",
  },
  {
    icon: Calendar,
    title: "Agenda inteligente",
    description:
      "Reserva de boxes e equipe, verificação automática de conflitos, agendamentos recorrentes e encaixes.",
  },
  {
    icon: Users,
    title: "CRM automotivo",
    description:
      "Histórico completo por cliente e por veículo. Preferências, recorrência, valor investido e aniversários.",
  },
  {
    icon: Wallet,
    title: "Financeiro conectado",
    description:
      "Contas a pagar, a receber, DRE gerencial, comissões, ponto de equilíbrio e margem por serviço.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-empresa com RLS",
    description:
      "Isolamento real por tenant no banco de dados. Cada estabelecimento com seus próprios dados, equipe e permissões.",
  },
  {
    icon: Sparkles,
    title: "Portal do cliente",
    description:
      "Seu cliente consulta o status pelo celular, agenda online e acompanha pontos de fidelidade sem instalar nada.",
  },
];

const steps = [
  {
    n: "01",
    title: "Cliente chega",
    text: "Recepção abre a OS em segundos: busca por placa, vincula o veículo e seleciona os serviços.",
  },
  {
    n: "02",
    title: "Operação executa",
    text: "A OS aparece no Kanban. Cada etapa é visível: aguardando, em execução, inspeção, pronto.",
  },
  {
    n: "03",
    title: "Veículo pronto",
    text: "Notificação disparada ao cliente, cobrança integrada, comissão calculada automaticamente.",
  },
  {
    n: "04",
    title: "Gestão enxerga tudo",
    text: "Faturamento do dia, veículos atrasados, boxes ociosos e ranking de produtividade em tempo real.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "R$ 149",
    period: "/mês",
    description: "Para lava-rápidos independentes.",
    features: [
      "1 unidade",
      "Até 3 usuários",
      "Clientes, veículos, agenda e OS",
      "Dashboard operacional",
    ],
  },
  {
    name: "Pro",
    price: "R$ 349",
    period: "/mês",
    description: "Para operações com equipe fixa.",
    features: [
      "Até 2 unidades",
      "Usuários ilimitados",
      "Estoque, comissões e DRE gerencial",
      "Portal do cliente + notificações",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    description: "Multi-unidade com inteligência operacional.",
    features: [
      "Unidades ilimitadas",
      "SSO e auditoria avançada",
      "API e integrações customizadas",
      "Previsão de demanda e BI",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <BrandLogo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#funcionalidades" className="hover:text-foreground">
              Funcionalidades
            </a>
            <a href="#como-funciona" className="hover:text-foreground">
              Como funciona
            </a>
            <a href="#planos" className="hover:text-foreground">
              Planos
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild variant="electric" size="sm">
              <Link href="/registro">
                Criar conta <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 gradient-brand opacity-[0.07]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--brand-electric)/0.12),transparent_70%)]" />
        <div className="container grid gap-12 py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-28">
          <div className="flex flex-col justify-center">
            <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              <span className="text-xs">ERP SaaS · Lava-carros &amp; estética</span>
            </Badge>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
              A operação do seu lava-carros,{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                sob controle
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
              LAVPRO centraliza agendamento, ordens de serviço, equipe,
              estoque, financeiro e indicadores em uma única plataforma —
              desenhada para lava-carros, centros de estética e detalhadores.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="electric">
                <Link href="/registro">
                  Começar teste grátis <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                14 dias grátis
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Sem cartão
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Multi-unidade
              </div>
            </div>
          </div>

          {/* Mock do dashboard */}
          <div className="relative">
            <div className="relative rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-primary/10">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Gauge className="h-4 w-4 text-secondary" />
                  Dashboard LAVPRO
                </div>
                <Badge variant="outline">Hoje</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: "Faturamento", value: "R$ 4.820" },
                  { label: "Veículos", value: "27" },
                  { label: "Ticket médio", value: "R$ 178" },
                  { label: "Ocupação", value: "82%" },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <div className="text-xs text-muted-foreground">
                      {k.label}
                    </div>
                    <div className="mt-1 text-xl font-semibold">{k.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-border bg-background p-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Veículos em atendimento
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    { placa: "ABC-1D23", status: "Em execução", cor: "bg-secondary" },
                    { placa: "RSP-7K42", status: "Inspeção", cor: "bg-warning" },
                    { placa: "GHI-9F10", status: "Pronto", cor: "bg-success" },
                  ].map((v) => (
                    <div key={v.placa} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                      <div className="font-mono font-semibold">{v.placa}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={`h-2 w-2 rounded-full ${v.cor}`} />
                        {v.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -right-6 -top-6 -z-10 h-32 w-32 rounded-full bg-secondary/20 blur-3xl" />
            <div className="absolute -bottom-6 -left-6 -z-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" className="border-t border-border bg-muted/30">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline">Plataforma completa</Badge>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Tudo o que um lava-carros moderno precisa
            </h2>
            <p className="mt-4 text-muted-foreground">
              Do primeiro atendimento ao fechamento do mês. Uma única
              plataforma, sem planilhas, sem ferramentas desconectadas.
            </p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="border-t border-border">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline">Fluxo operacional</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Da chegada à entrega em 4 passos
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="text-sm font-mono text-secondary">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="planos" className="border-t border-border bg-muted/30">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline">Planos</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Comece grátis. Escale quando precisar.
            </h2>
            <p className="mt-4 text-muted-foreground">
              14 dias de teste em qualquer plano. Sem fidelidade. Cancele
              quando quiser.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-xl border p-7 ${
                  p.highlighted
                    ? "border-secondary bg-card shadow-lg"
                    : "border-border bg-card"
                }`}
              >
                {p.highlighted ? (
                  <Badge
                    variant="default"
                    className="absolute -top-3 right-6 bg-secondary text-secondary-foreground"
                  >
                    Mais escolhido
                  </Badge>
                ) : null}
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold">{p.price}</span>
                  <span className="text-muted-foreground">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={p.highlighted ? "electric" : "outline"}
                  className="mt-8 w-full"
                >
                  <Link href="/registro">Começar agora</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="container py-20">
          <div className="relative overflow-hidden rounded-2xl gradient-brand p-10 text-white md:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(40%_80%_at_80%_20%,rgba(255,255,255,0.15),transparent)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                  Sua operação sob controle começa hoje.
                </h2>
                <p className="mt-3 max-w-xl text-white/80">
                  Migre suas planilhas para uma plataforma pensada para
                  lava-carros. 14 dias grátis, sem cartão.
                </p>
              </div>
              <div className="flex items-center gap-3 lg:justify-end">
                <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  <Link href="/registro">Criar conta grátis</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link href="/login">Entrar</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center">
          <BrandLogo size="sm" withTagline />
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LAVPRO. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
