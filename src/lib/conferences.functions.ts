import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Role = "caixa" | "egttv";
export type Validacao = { concorda: boolean; justificativa: string; nome: string; matricula: string; validadoEm: string; responsavelId?: string; autenticacao?: "individual" | "compartilhada" };
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
// Temporary shared login requested by the user until a new user-validation process is added.
const credSchema = z.object({ usuario: z.string().max(100), senha: z.string().max(100) });
function assertCred(c: { usuario: string; senha: string }) {
  if (!c.usuario.trim() || c.senha !== "Admin") throw new Error("Matrícula ou senha inválidas.");
}
export const checkLogin = createServerFn({ method: "POST" })
  .inputValidator((d) => credSchema.parse(d))
  .handler(async ({ data }) => { assertCred(data); return { ok: true }; });
export const saveConference = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ dados: z.record(z.string(), z.unknown()) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let i = 0; i < 3; i++) {
      const codigo = generateCode();
      const { error } = await supabaseAdmin.from("conferencias").insert({ codigo, dados: data.dados as never });
      if (error) { if (error.code === "23505") continue; throw new Error(error.message); }
      return { codigo, dados: JSON.stringify(data.dados) };
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
  .inputValidator((d) => z.object({ cred: credSchema, nome: z.string().trim().min(3).max(200), matricula: z.string().trim().min(1).max(50), codigo: codeSchema, concorda: z.boolean(), justificativa: z.string().max(2000) }).refine((v) => v.concorda || v.justificativa.trim().length > 0, "Justificativa obrigatória").parse(d))
  .handler(async ({ data }) => {
    assertCred(data.cred);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const v: Validacao = { concorda: data.concorda, justificativa: data.concorda ? "" : data.justificativa.trim(), nome: data.nome, matricula: data.matricula, validadoEm: new Date().toISOString(), autenticacao: "compartilhada" };
    const { data: rows, error } = await supabaseAdmin.from("conferencias").update({ validacao: v as never }).eq("codigo", data.codigo).is("validacao", null).select("codigo");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error("Conferência não encontrada ou já validada");
    return v;
  });
