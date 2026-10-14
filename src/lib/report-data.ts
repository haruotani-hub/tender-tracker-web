import { CURRENCIES, keyOf, saldoOf, summarize, type Session } from "@/lib/counter-store";

export type Saved = { session: Session; counts: Record<string, number> };
export type ReportRow = {
  label: string;
  usable: number | null;
  damaged: number | null;
  usableValue: number;
  damagedValue: number;
  total: number;
};

export function reportData(d: Saved) {
  return CURRENCIES.map((currency) => {
    const rows: ReportRow[] = [];
    if (currency.code === "BRL") {
      const types = [
        { label: "2ª família", usable: "f2c", damaged: "f2d", kind: "n" as const },
        { label: "1ª família", usable: null, damaged: "f1d", kind: "n" as const },
        { label: "Moeda", usable: "coins", damaged: null, kind: "c" as const },
      ];
      for (const type of types) {
        const family = currency.families.find((f) => f.id === (type.usable ?? type.damaged));
        if (!family) continue;
        for (const face of type.kind === "n" ? family.notes : family.coins) {
          const usable = type.usable ? (d.counts[keyOf(currency.code, type.usable, type.kind, face)] ?? 0) : null;
          const damaged = type.damaged ? (d.counts[keyOf(currency.code, type.damaged, type.kind, face)] ?? 0) : null;
          const usableValue = (usable ?? 0) * face;
          const damagedValue = (damaged ?? 0) * face;
          rows.push({ label: `${type.label} · ${(face / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, usable, damaged, usableValue, damagedValue, total: usableValue + damagedValue });
        }
      }
    } else {
      for (const family of currency.families) {
        for (const face of family.notes) {
          const usable = d.counts[keyOf(currency.code, family.id, "n", face)] ?? 0;
          rows.push({ label: (face / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 }), usable, damaged: null, usableValue: usable * face, damagedValue: 0, total: usable * face });
        }
      }
    }
    const sum = summarize(currency, d.counts);
    const balance = saldoOf(d.session, currency.code);
    return { currency, rows, sum, balance, difference: sum.value - balance, observations: d.session.just?.[currency.code]?.trim() ?? "" };
  });
}