import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: "validated-account" }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let parse: (data: unknown) => unknown = (data) => data;
    let protectedCall = false;
    const builder = {
      middleware: () => { protectedCall = true; return builder; },
      inputValidator: (validator: (data: unknown) => unknown) => { parse = validator; return builder; },
      handler: (handler: (params: unknown) => unknown) => async (input: { data: unknown; context?: unknown }) => {
        if (protectedCall && !input.context) throw new Error("Individual authentication required");
        return handler({ ...input, data: parse(input.data) });
      },
    };
    return builder;
  },
}));
import { validateConference } from "@/lib/conferences.functions";
const invoke = validateConference as unknown as (input: { data: unknown; context?: unknown }) => Promise<unknown>;
const codigo = "A".repeat(32);
describe("individual electronic validation", () => {
  it("requires an individually authenticated account", async () => {
    await expect(invoke({ data: { codigo, concorda: true, justificativa: "" } })).rejects.toThrow("Individual authentication required");
  });
  it("derives responsible identity and timestamp from the atomic database act, ignoring typed evidence", async () => {
    const record = { nome: "Haruo Otani", matricula: "C123456", responsavelId: "account-123", validadoEm: "2026-10-14T23:31:00Z", concorda: true, justificativa: "", autenticacao: "individual" };
    const rpc = vi.fn().mockResolvedValue({ data: record, error: null });
    const result = await invoke({ context: { supabase: { rpc }, userId: "account-123" }, data: { codigo, concorda: true, justificativa: "", nome: "Forged Person", matricula: "FORGED", validadoEm: "2099-01-01" } });
    expect(rpc).toHaveBeenCalledWith("validate_tcv_individual", { p_codigo: codigo, p_concorda: true, p_justificativa: "" });
    expect(result).toEqual(record);
  });
  it("requires justification when the responsible person disagrees", async () => {
    const rpc = vi.fn();
    await expect(invoke({ context: { supabase: { rpc } }, data: { codigo, concorda: false, justificativa: " " } })).rejects.toThrow("Justificativa obrigatória");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("does not report success when an already recorded act is rejected", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "Conferência não encontrada ou já validada" } });
    await expect(invoke({ context: { supabase: { rpc } }, data: { codigo, concorda: true, justificativa: "" } })).rejects.toThrow("já validada");
  });
});
