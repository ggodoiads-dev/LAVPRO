import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Membership, Profile, Tenant } from "@/types/database";

export interface Session {
  user: { id: string; email: string | null } | null;
  profile: Profile | null;
  memberships: (Membership & { tenant?: Tenant | null })[];
  activeTenant: Tenant | null;
  activeMembership: Membership | null;
  isDemo: boolean;
}

/**
 * Obtém a sessão do usuário atual (RSC). Escolhe o primeiro tenant ativo
 * como o "tenant corrente" — em iteração futura, pode vir de cookie/preferência.
 */
export const getSession = cache(async (): Promise<Session> => {
  const supabase = createServerSupabase();
  if (!supabase) {
    return {
      user: null,
      profile: null,
      memberships: [],
      activeTenant: null,
      activeMembership: null,
      isDemo: true,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      memberships: [],
      activeTenant: null,
      activeMembership: null,
      isDemo: false,
    };
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("*, tenant:tenants(*)")
      .eq("user_id", user.id)
      .eq("ativo", true),
  ]);

  const activeMembership =
    (memberships as (Membership & { tenant: Tenant })[] | null)?.[0] ?? null;

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: (profile as Profile | null) ?? null,
    memberships: (memberships as (Membership & { tenant: Tenant })[]) ?? [],
    activeTenant: activeMembership?.tenant ?? null,
    activeMembership: activeMembership ?? null,
    isDemo: false,
  };
});
