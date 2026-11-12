"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { moveOrdemStatus } from "@/app/(app)/ordens/actions";
import { statusConfig } from "@/lib/status";
import type { StatusOS } from "@/types/database";

function MoveButton({ para }: { para: StatusOS }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="para"
      value={para}
      disabled={pending}
      className="inline-flex items-center justify-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      → {statusConfig[para].short}
    </button>
  );
}

export function StatusMove({
  id,
  transicoes,
}: {
  id: string;
  transicoes: StatusOS[];
}) {
  if (transicoes.length === 0) return null;
  return (
    <form action={moveOrdemStatus} className="flex flex-wrap gap-1.5 pt-2">
      <input type="hidden" name="id" value={id} />
      {transicoes.map((t) => (
        <MoveButton key={t} para={t} />
      ))}
    </form>
  );
}
