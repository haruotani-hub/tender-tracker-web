import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Role = "caixa" | "egttv";
export type Validacao = { concorda: boolean; justificativa: string; nome: string; matricula: string; validadoEm: string; responsavelId?: string; autenticacao?: "individual" };
const ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export function generateCode(len = 32) {
  const out: string[] = [];
  const buf = new Uint8Array(1);
  while (out.length < len) {
    crypto.getRandomValues(buf);
    const b = buf[0];
    if (b !== undefined && b < 248) { const char = ALNUM[b % 62]; if (char) out.push(char); }
  }
  return out.join("");
}
const codeSchema = z.string().regex(/^[A-Za-z0-9]{32}$/);
export const saveConference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ dados: z.record(z.string(), z.unknown()) }).parse(d))
  .handler(async ({ data, context }) => {
    for (let i = 0; i < 3; i++) {
      const codigo = generateCode();
      const { error } = await context.supabase.from("conferencias").insert({ codigo, dados: data.dados as never, responsavel_id: context.userId });
      if (error) { if (error.code === "23505") continue; throw new Error(error.message); }
      const { data: row, error: readError } = await context.supabase.from("conferencias").select("dados").eq("codigo", codigo).single();
      if (readError) throw new Error("Conferência salva; consulte pelo código " + codigo);
      return { codigo, dados: JSON.stringify(row.dados) };
    }
    throw new Error("Falha ao gerar código.");
  });
// The unguessable conference code remains a read-only sharing capability.
export const getConference = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ codigo: codeSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("conferencias").select("codigo, dados, validacao, criado_em").eq("codigo", data.codigo).maybeSingle();
    if (!row) return null;
    return { codigo: row.codigo, dados: JSON.stringify(row.dados), validacao: row.validacao as Validacao | null, criadoEm: row.criado_em };
  });
export const validateConference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ codigo: codeSchema, concorda: z.boolean(), justificativa: z.string().max(2000) }).refine((v) => v.concorda || v.justificativa.trim().length > 0, "Justificativa obrigatória").parse(d))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("validate_tcv_individual", { p_codigo: data.codigo, p_concorda: data.concorda, p_justificativa: data.justificativa });
    if (error) throw new Error(error.message);
    return result as Validacao;
  });
