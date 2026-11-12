import { NextResponse } from "next/server";
import {
  listClientes,
  listComissoes,
  listContasPagar,
  listFuncionarios,
  listOrdens,
  listProdutos,
  listServicos,
  listVeiculos,
} from "@/lib/data/queries";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

const EXPORTERS: Record<string, () => Promise<Record<string, unknown>[]>> = {
  clientes: async () => {
    const rows = await listClientes();
    return rows.map((c) => ({
      nome: c.nome,
      documento: c.documento,
      telefone: c.telefone,
      whatsapp: c.whatsapp,
      email: c.email,
      consent_marketing: c.consent_marketing,
    }));
  },
  veiculos: async () => {
    const rows = await listVeiculos();
    return rows.map((v) => ({
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      ano: v.ano,
      cor: v.cor,
      categoria: v.categoria,
    }));
  },
  servicos: async () => {
    const rows = await listServicos();
    return rows.map((s) => ({
      nome: s.nome,
      categoria: s.categoria,
      preco_base: s.preco_base,
      custo_estimado: s.custo_estimado,
      duracao_min: s.duracao_min,
      comissao_percentual: s.comissao_percentual,
      ativo: s.ativo,
    }));
  },
  ordens: async () => {
    const rows = await listOrdens();
    return rows.map((o) => ({
      numero: o.numero,
      status: o.status,
      aberta_em: o.aberta_em,
      entregue_em: o.entregue_em,
      subtotal: o.subtotal,
      desconto: o.desconto,
      total: o.total,
    }));
  },
  produtos: async () => {
    const rows = await listProdutos();
    return rows.map((p) => ({
      codigo: p.codigo,
      nome: p.nome,
      categoria: p.categoria,
      unidade: p.unidade,
      custo_medio: p.custo_medio,
      estoque_atual: p.estoque_atual,
      estoque_minimo: p.estoque_minimo,
      ativo: p.ativo,
    }));
  },
  funcionarios: async () => {
    const rows = await listFuncionarios();
    return rows.map((f) => ({
      nome: f.nome,
      cargo: f.cargo,
      vinculo: f.vinculo,
      admissao: f.admissao,
      comissao_padrao: f.comissao_padrao,
      ativo: f.ativo,
    }));
  },
  comissoes: async () => {
    const rows = await listComissoes();
    return rows.map((c) => ({
      ordem_id: c.ordem_id,
      funcionario_id: c.funcionario_id,
      base: c.base,
      percentual: c.percentual,
      valor: c.valor,
      status: c.status,
      pago_em: c.pago_em,
    }));
  },
  contas_pagar: async () => {
    const rows = await listContasPagar();
    return rows.map((c) => ({
      descricao: c.descricao,
      valor: c.valor,
      vencimento: c.vencimento,
      pago_em: c.pago_em,
      recorrente: c.recorrente,
    }));
  },
};

export async function GET(
  _req: Request,
  { params }: { params: { recurso: string } },
) {
  const exporter = EXPORTERS[params.recurso];
  if (!exporter) {
    return NextResponse.json({ error: "recurso desconhecido" }, { status: 404 });
  }
  const rows = await exporter();
  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lavpro-${params.recurso}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
