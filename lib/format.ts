const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const money = (n: number, currency = "RWF") =>
  `${nf.format(n)} ${currency}`;

export const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/** "MTN_MOMO" → "Mtn momo" */
export const pretty = (s: string) => {
  const t = s.replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const options = (values: string[]) =>
  values.map((v) => ({ value: v, label: pretty(v) }));
