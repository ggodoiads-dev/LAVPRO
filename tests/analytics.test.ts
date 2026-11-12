import { describe, expect, it } from "vitest";
import {
  forecastDemanda,
  picosDemanda,
  type SlotDemanda,
} from "@/lib/analytics/forecast";
import { recomendacoesOperacionais } from "@/lib/analytics/recomendacoes";
import { projetarDre } from "@/lib/analytics/projecao";
import { toCsv } from "@/lib/csv";
import { rateLimit } from "@/lib/rate-limit";
import type {
  Cliente,
  OrdemServico,
  Produto,
  Servico,
} from "@/types/database";
import type { DreLinha } from "@/lib/data/queries";

function base<T extends Record<string, unknown>>(x: T): T {
  return x;
}

describe("forecastDemanda", () => {
  it("retorna 24 * 7 slots mesmo sem dados", () => {
    const slots = forecastDemanda([]);
    expect(slots).toHaveLength(24 * 7);
    expect(slots.every((s) => s.qtd === 0)).toBe(true);
  });

  it("acumula OS no slot correto e normaliza share", () => {
    const quando = new Date();
    quando.setHours(10, 0, 0, 0);
    const o: OrdemServico = {
      id: "o1",
      tenant_id: "t",
      unidade_id: "u",
      numero: 1,
      cliente_id: "c",
      veiculo_id: "v",
      box_id: null,
      agendamento_id: null,
      status: "entregue",
      aberta_em: quando.toISOString(),
      inicio_execucao: null,
      fim_execucao: null,
      prevista_em: null,
      entregue_em: quando.toISOString(),
      motivo_suspensao: null,
      subtotal: 100,
      desconto: 0,
      total: 100,
      checklist: {},
      observacoes: null,
      created_at: quando.toISOString(),
      updated_at: quando.toISOString(),
    };
    const slots = forecastDemanda([o, o, o]);
    const alvo = slots.find(
      (s) => s.dia === quando.getDay() && s.hora === quando.getHours(),
    ) as SlotDemanda;
    expect(alvo.qtd).toBe(3);
    expect(alvo.share).toBe(1);
  });

  it("ignora canceladas", () => {
    const quando = new Date();
    const o: OrdemServico = {
      ...({} as OrdemServico),
      id: "o1",
      aberta_em: quando.toISOString(),
      status: "cancelado",
      total: 0,
    };
    const slots = forecastDemanda([o]);
    expect(slots.every((s) => s.qtd === 0)).toBe(true);
  });
});

describe("picosDemanda", () => {
  it("ordena por qtd e retorna top N não-zero", () => {
    const slots: SlotDemanda[] = Array.from({ length: 24 * 7 }, (_, i) => ({
      dia: Math.floor(i / 24) % 7,
      hora: i % 24,
      qtd: i < 10 ? i : 0,
      receita: 0,
      media: 0,
      share: 0,
    }));
    const p = picosDemanda(slots, 3);
    expect(p).toHaveLength(3);
    expect(p[0].qtd).toBeGreaterThanOrEqual(p[1].qtd);
    expect(p[p.length - 1].qtd).toBeGreaterThan(0);
  });
});

describe("recomendacoesOperacionais", () => {
  const cliente = (patch: Partial<Cliente> = {}): Cliente =>
    base({
      id: "c1",
      tenant_id: "t",
      nome: "A",
      documento: null,
      telefone: null,
      whatsapp: null,
      email: null,
      endereco: null,
      nascimento: null,
      observacoes: null,
      preferencias: {},
      consent_marketing: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...patch,
    });

  const servico = (patch: Partial<Servico> = {}): Servico =>
    base({
      id: "s1",
      tenant_id: "t",
      nome: "Vitrificação",
      categoria: null,
      descricao: null,
      preco_base: 1000,
      custo_estimado: 50,
      duracao_min: 60,
      funcionarios_min: 1,
      comissao_percentual: 20,
      ativo: true,
      ...patch,
    });

  it("detecta produtos abaixo do mínimo", () => {
    const produtos: Produto[] = [
      {
        id: "p1",
        tenant_id: "t",
        codigo: null,
        nome: "Shampoo",
        categoria: null,
        unidade: "L",
        fornecedor: null,
        custo_medio: 10,
        preco_venda: null,
        estoque_atual: 1,
        estoque_minimo: 5,
        local: null,
        ativo: true,
        created_at: "",
        updated_at: "",
      },
    ];
    const recs = recomendacoesOperacionais({
      ordens: [],
      clientes: [],
      servicos: [],
      produtos,
    });
    expect(recs.some((r) => r.id === "estoque-minimo")).toBe(true);
  });

  it("reconhece margem comercial alta", () => {
    const recs = recomendacoesOperacionais({
      ordens: [],
      clientes: [],
      servicos: [servico()],
      produtos: [],
    });
    expect(recs.some((r) => r.id === "servicos-margem")).toBe(true);
  });

  it("detecta clientes inativos a partir da última visita", () => {
    const antigo = new Date();
    antigo.setDate(antigo.getDate() - 90);
    const ordens: OrdemServico[] = [
      {
        ...({} as OrdemServico),
        id: "o1",
        cliente_id: "c1",
        aberta_em: antigo.toISOString(),
        status: "entregue",
      },
    ];
    const recs = recomendacoesOperacionais({
      ordens,
      clientes: [cliente({ id: "c1" })],
      servicos: [],
      produtos: [],
    });
    expect(recs.some((r) => r.id === "clientes-inativos")).toBe(true);
  });
});

describe("projetarDre", () => {
  it("multiplica valores pelo fator dias no mês / dias decorridos", () => {
    const dre: DreLinha[] = [
      { rotulo: "Receita líquida", valor: 1000, destaque: true },
    ];
    const meio = new Date(2025, 0, 15); // 15 de janeiro
    const p = projetarDre(dre, meio);
    expect(p.diasDecorridos).toBe(15);
    expect(p.diasNoMes).toBe(31);
    expect(p.linhas[0].projetado).toBeCloseTo((1000 * 31) / 15, 5);
  });
});

describe("toCsv", () => {
  it("produz BOM + header + linhas com escape", () => {
    const csv = toCsv([
      { nome: "Ana, Silva", tel: '(11) "9" 0000' },
      { nome: "Bruno\nquebra", tel: null },
    ]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain(`"Ana, Silva"`);
    expect(csv).toContain(`"(11) ""9"" 0000"`);
    expect(csv).toContain(`"Bruno\nquebra"`);
  });

  it("devolve só BOM para array vazio", () => {
    expect(toCsv([])).toBe("﻿");
  });
});

describe("rateLimit", () => {
  it("permite até a capacidade e bloqueia o excedente", () => {
    const key = `test-${Math.random()}`;
    let bloqueou = false;
    for (let i = 0; i < 15; i++) {
      const r = rateLimit("book", key);
      if (!r.ok) {
        bloqueou = true;
        expect(r.retryAfter).toBeGreaterThan(0);
        break;
      }
    }
    expect(bloqueou).toBe(true);
  });
});
