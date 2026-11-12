/**
 * LAVPRO - Camada de notificações.
 *
 * Esta é a porta de saída usada pela aplicação. Por enquanto, cada envio é
 * apenas enfileirado em `public.notificacoes` com `status = 'pendente'`.
 *
 * As integrações reais (WhatsApp via Z-API/Meta Cloud, SMS via Twilio,
 * e-mail via Resend/SendGrid) serão plugadas aqui quando as credenciais
 * existirem — sem alterar os pontos de chamada no app. Enquanto isso
 * nada é enviado para fora.
 *
 * Fase 3 entrega a infraestrutura (fila + templates + disparo); a Fase 3+
 * entrega os workers de envio.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import type { CanalNotificacao } from "@/types/database";

export interface QueueMessage {
  canal: CanalNotificacao;
  destinatario: string;
  corpo: string;
  assunto?: string | null;
  cliente_id?: string | null;
  ordem_id?: string | null;
  template_codigo?: string | null;
  agendada_para?: string | null;
}

export async function enqueueNotification(msg: QueueMessage) {
  const session = await getSession();
  const supabase = createServerSupabase();
  if (!supabase || !session.activeTenant) return { ok: false };

  const { error } = await supabase.from("notificacoes").insert({
    tenant_id: session.activeTenant.id,
    cliente_id: msg.cliente_id ?? null,
    ordem_id: msg.ordem_id ?? null,
    template_codigo: msg.template_codigo ?? null,
    canal: msg.canal,
    destinatario: msg.destinatario,
    assunto: msg.assunto ?? null,
    corpo: msg.corpo,
    status: "pendente",
    agendada_para: msg.agendada_para ?? null,
  });

  return { ok: !error, error: error?.message };
}

/**
 * Simples renderização de template `{placeholder}` com um record.
 * Mantido intencionalmente mínimo para evitar dependências.
 */
export function renderTemplate(
  corpo: string,
  vars: Record<string, string | number | null | undefined>,
) {
  return corpo.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}

export const TEMPLATES_PADRAO = {
  agendamento_confirmado: {
    canal: "whatsapp" as CanalNotificacao,
    corpo:
      "Olá {nome}, seu horário em {data} está confirmado. Chegue com 10 min de antecedência. Qualquer ajuste, me chame por aqui.",
  },
  lembrete_agendamento: {
    canal: "whatsapp" as CanalNotificacao,
    corpo:
      "Oi {nome}, lembrete do seu atendimento amanhã às {hora}. Até lá!",
  },
  veiculo_pronto: {
    canal: "whatsapp" as CanalNotificacao,
    corpo:
      "Olá {nome}, seu {veiculo} está pronto para retirada. Obrigado pela confiança!",
  },
  reativacao: {
    canal: "email" as CanalNotificacao,
    corpo:
      "Olá {nome}, faz um tempo que não te vemos. Que tal agendar uma lavagem com 10% de desconto nesta semana?",
    assunto: "Sentimos sua falta",
  },
};
