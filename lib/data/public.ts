/**
 * Camada de leitura pública: usa cliente Supabase sem sessão.
 * Em modo demo, devolve dados do tenant de demonstração.
 */

import { createServerClient } from "@supabase/ssr";
import {
  IS_SUPABASE_CONFIGURED,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/supabase/env";
import { DEMO_SERVICOS } from "./demo";
import type { Servico, Tenant } from "@/types/database";

function anonClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: { getAll() { return []; }, setAll() {} },
  });
}

export async function getTenantPublic(
  slug: string,
): Promise<{ tenant: Tenant | null; servicos: Servico[] }> {
  if (!IS_SUPABASE_CONFIGURED) {
    return {
      tenant: {
        id: "demo-tenant",
        nome: "LAV-DEMO",
        slug,
        documento: null,
        telefone: null,
        email: null,
        plano: "trial",
        status: "ativo",
        logo_url: null,
        trial_termina_em: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      servicos: DEMO_SERVICOS,
    };
  }
  const supabase = anonClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("status", "ativo")
    .maybeSingle();
  if (!tenant) return { tenant: null, servicos: [] };
  const { data: servicos } = await supabase
    .from("servicos")
    .select("*")
    .eq("tenant_id", (tenant as Tenant).id)
    .eq("ativo", true)
    .order("nome");
  return {
    tenant: tenant as Tenant,
    servicos: (servicos as Servico[]) ?? [],
  };
}

export interface PortalConsultaResult {
  cliente?: { nome: string };
  veiculos?: Array<{
    placa: string;
    marca: string | null;
    modelo: string | null;
  }>;
  agendamentos?: Array<{
    inicio: string;
    status: string;
    observacoes?: string | null;
  }>;
  ordens?: Array<{
    numero: number;
    status: string;
    total: number;
    entregue_em: string | null;
    aberta_em?: string | null;
  }>;
  pontos?: number;
  error?: string;
}

export async function portalConsulta(
  slug: string,
  placa: string,
  telefone: string,
): Promise<PortalConsultaResult> {
  if (!IS_SUPABASE_CONFIGURED) {
    const digits = telefone.replace(/\D/g, "");
    if (!digits) return { error: "Informe o telefone." };
    return {
      cliente: { nome: "Cliente Demo" },
      veiculos: [{ placa: placa.toUpperCase(), marca: "Honda", modelo: "Civic" }],
      agendamentos: [],
      ordens: [
        {
          numero: 1023,
          status: "entregue",
          total: 180,
          entregue_em: new Date().toISOString(),
        },
      ],
      pontos: 180,
    };
  }
  const supabase = anonClient();
  const { data, error } = await supabase.rpc("portal_consulta", {
    p_slug: slug,
    p_placa: placa,
    p_telefone: telefone,
  });
  if (error) return { error: error.message };
  return (data as PortalConsultaResult) ?? { error: "sem_dados" };
}
