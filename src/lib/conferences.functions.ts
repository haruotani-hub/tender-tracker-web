import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Role = "caixa" | "egttv";
export type Validacao = {
  concorda: boolean;
  justificativa: string;
  nome: string;
  matricula: string;
  validadoEm: string;
};

const enc = new TextEncoder();
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

async function hmac(msg: string) {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("SESSION_SECRET ausente");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha(s: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}
async function safeEqual(a: string, b: string) {
  const [x, y] = await Promise.all([sha(a), sha(b)]);
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i]! ^ y[i]!;
  return d === 0;
}

async function verifyToken(token: string, role: Role) {
  const [r, exp, sig] = token.split(".");
  if (r !== role || !exp || !sig || Number(exp) < Date.now()) throw new Error("Sessão expirada. Faça login novamente.");
  if (!(await safeEqual(sig, await hmac(`${r}.${exp}`)))) throw new Error("Sessão inválida.");
}

const ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export function generateCode(len = 32) {
  const out: string[] = [];
  const buf = new Uint8Array(1);
  while (out.length < len) {
    crypto.getRandomValues(buf);
    const b = buf[0]!;
    if (b < 248) out.push(ALNUM[b % 62]!); // sem viés
  }
  return out.join("");
}

const roleSchema = z.enum(["caixa", "egttv"]);
const codeSchema = z.string().regex(/^[A-Za-z0-9]{32}$/);

export const login = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ role: roleSchema, usuario: z.string().max(100), senha: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    // Credencial padrão de teste
    const okUser = await safeEqual(data.usuario, "Admin");
    const okPass = await safeEqual(data.senha, "Admin");
    if (!okUser || !okPass) return { ok: false as const };
    const exp = Date.now() + TOKEN_TTL_MS;
    return { ok: true as const, token: `${data.role}.${exp}.${await hmac(`${data.role}.${exp}`)}` };
  });

export const saveConference = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().max(300), dados: z.record(z.string(), z.unknown()) }).parse(d))
  .handler(async ({ data }) => {
    await verifyToken(data.token, "caixa");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let i = 0; i < 3; i++) {
      const codigo = generateCode();
      const { error } = await supabaseAdmin.from("conferencias").insert({ codigo, dados: data.dados as never });
      if (!error) return { codigo };
      if (error.code !== "23505") throw new Error("Falha ao salvar a conferência.");
    }
    throw new Error("Falha ao gerar código.");
  });

export const getConference = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ codigo: codeSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("conferencias").select("codigo, dados, validacao, criado_em").eq("codigo", data.codigo).maybeSingle();
    if (!row) return null;
    return { codigo: row.codigo, dados: row.dados as Record<string, unknown>, validacao: row.validacao as Validacao | null, criadoEm: row.criado_em };
  });

export const validateConference = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      token: z.string().max(300),
      codigo: codeSchema,
      concorda: z.boolean(),
      justificativa: z.string().max(2000),
      nome: z.string().trim().min(3).max(120),
      matricula: z.string().trim().min(1).max(40),
    }).refine((v) => v.concorda || v.justificativa.trim().length > 0, "Justificativa obrigatória").parse(d))
  .handler(async ({ data }) => {
    await verifyToken(data.token, "egttv");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("conferencias").select("validacao").eq("codigo", data.codigo).maybeSingle();
    if (!row) throw new Error("Conferência não encontrada.");
    if (row.validacao) throw new Error("Esta conferência já foi validada.");
    const validacao: Validacao = {
      concorda: data.concorda, justificativa: data.concorda ? "" : data.justificativa.trim(),
      nome: data.nome, matricula: data.matricula, validadoEm: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from("conferencias").update({ validacao: validacao as never }).eq("codigo", data.codigo).is("validacao", null);
    if (error) throw new Error("Falha ao registrar validação.");
    return validacao;
  });
