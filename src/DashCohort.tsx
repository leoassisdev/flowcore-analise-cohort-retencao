// DashCohort · Criado por FlowCore Soluções LTDA · flowcoresolucoes.com.br/codigos · licença MIT
// Tabela de retenção por coorte: clientes agrupados pelo mês de entrada e quantos
// continuam ativos nos meses 0 a 11, com escala de cor, linha de média e alternância % / absoluto.
// Pra usar dados reais, troque o array DADOS pela resposta da sua API (tamanho + ativos por mês).
// Props: accent, coortes, tema ("claro" | "escuro", padrão "claro") e onTemaChange
// (avisa quando o botão sol/lua troca o tema).
// Requisitos: React 18+ e Tailwind CSS 3+. Zero dependências.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Tema = "claro" | "escuro";
type Coorte = { mes: string; clientes: number; ativos: number[] };

// Paleta de cada tema, aplicada como CSS vars na raiz (não depende do dark: do Tailwind).
const TEMAS: Record<Tema, Record<string, string>> = {
  claro: {
    "--fc-bg": "#F7F8FB", "--fc-surface": "#FFFFFF", "--fc-surface-2": "#F1F4F9",
    "--fc-border": "#E3E8F0", "--fc-border-strong": "#CBD3E1",
    "--fc-text": "#0B1220", "--fc-muted": "#4B5565", "--fc-subtle": "#8A94A6",
    "--fc-pos": "#059669", "--fc-neg": "#E11D48", "--fc-warn": "#D97706",
    "--fc-shadow": "0 1px 2px rgba(16,24,40,.06), 0 12px 32px -16px rgba(16,24,40,.18)",
    "--fc-pop": "#FFFFFF", "--fc-grid": "#EDF0F5", "--fc-solid": "#FFFFFF",
  },
  escuro: {
    "--fc-bg": "#0B0F17", "--fc-surface": "rgba(255,255,255,0.03)", "--fc-surface-2": "rgba(255,255,255,0.06)",
    "--fc-border": "rgba(255,255,255,0.10)", "--fc-border-strong": "rgba(255,255,255,0.25)",
    "--fc-text": "#FFFFFF", "--fc-muted": "rgba(255,255,255,0.60)", "--fc-subtle": "rgba(255,255,255,0.40)",
    "--fc-pos": "#34D399", "--fc-neg": "#FB7185", "--fc-warn": "#FBBF24",
    "--fc-shadow": "0 24px 48px -24px rgba(0,0,0,.6)",
    "--fc-pop": "#111827", "--fc-grid": "rgba(255,255,255,0.06)", "--fc-solid": "#0D121B",
  },
};
const PALETA = ["var(--accent)", "#7C3AED", "#10B981", "#F59E0B", "#EC4899", "#06B6D4"];
const tinta = (cor: string, pct: number) => `color-mix(in srgb, ${cor} ${pct}%, transparent)`;

// Tema controlado pela prop, mas o botão sol/lua troca por dentro.
function useTema(inicial: Tema, onTemaChange?: (t: Tema) => void) {
  const [tema, setTema] = useState<Tema>(inicial);
  const [prop, setProp] = useState<Tema>(inicial);
  if (prop !== inicial) {
    setProp(inicial);
    setTema(inicial);
  }
  const alternar = () => {
    const novo: Tema = tema === "claro" ? "escuro" : "claro";
    setTema(novo);
    onTemaChange?.(novo);
  };
  return [tema, alternar] as const;
}

function BotaoTema({ tema, onClick }: { tema: Tema; onClick: () => void }) {
  const escuro = tema === "escuro";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={escuro ? "Ativar modo claro" : "Ativar modo escuro"}
      title={escuro ? "Modo claro" : "Modo escuro"}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface)] text-[var(--fc-muted)] transition-colors hover:bg-[var(--fc-surface-2)] hover:text-[var(--fc-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {escuro ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
        )}
      </svg>
    </button>
  );
}

function gerador(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const MESES = ["nov/25", "dez/25", "jan/26", "fev/26", "mar/26", "abr/26", "mai/26", "jun/26", "jul/26", "ago/26", "set/26", "out/26"];

const DADOS: Coorte[] = (() => {
  const r = gerador(42);
  return MESES.map((mes, i) => {
    const clientes = Math.round(180 + i * 14 + r() * 40);
    // Coortes mais novas retêm um pouco melhor (onboarding melhorou ao longo do ano).
    const piso = 0.34 + i * 0.008;
    const ativos = Array.from({ length: 12 - i }, (_, m) => {
      if (m === 0) return clientes;
      const taxa = piso + (1 - piso) * Math.exp(-m / 2.6) + (r() - 0.5) * 0.03;
      return Math.round(clientes * Math.min(1, taxa));
    });
    return { mes, clientes, ativos };
  });
})();

const pct = (v: number) => `${Math.round(v * 100)}%`;
// Largura das colunas fixas (coorte + clientes) e de cada célula de mês, em px.
const FIXO = 124;
const CELULA = 46;

export default function DashCohort({
  accent = "#0057FF",
  coortes = DADOS,
  tema = "claro",
  onTemaChange,
}: {
  accent?: string;
  coortes?: Coorte[];
  tema?: Tema;
  onTemaChange?: (t: Tema) => void;
}) {
  const [tm, alternarTema] = useTema(tema, onTemaChange);
  const [modo, setModo] = useState<"pct" | "abs">("pct");
  const [foco, setFoco] = useState<{ c: number; m: number } | null>(null);
  const colunas = Math.max(...coortes.map((c) => c.ativos.length));
  // Quantos meses cabem lado a lado: mede a largura real do contêiner (ResizeObserver
  // da própria janela do elemento, funciona em iframe/portal). Em telas estreitas a
  // tabela mostra uma janela de meses com setas, em vez de rolar para o lado.
  const caixa = useRef<HTMLDivElement>(null);
  const [cabem, setCabem] = useState(colunas);
  const [inicio, setInicio] = useState(0);
  useEffect(() => {
    const el = caixa.current;
    const RO = el?.ownerDocument.defaultView?.ResizeObserver;
    if (!el || !RO) return;
    const medir = () => setCabem(Math.max(3, Math.floor((el.clientWidth - FIXO) / CELULA)));
    medir();
    const ro = new RO(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const janela = Math.min(colunas, cabem);
  const ini = Math.min(inicio, colunas - janela);
  const meses = Array.from({ length: janela }, (_, k) => ini + k);

  const medias = useMemo(
    () =>
      Array.from({ length: colunas }, (_, m) => {
        const validas = coortes.filter((c) => c.ativos[m] !== undefined);
        const ativos = validas.reduce((s, c) => s + c.ativos[m], 0);
        const base = validas.reduce((s, c) => s + c.clientes, 0);
        return { taxa: base ? ativos / base : 0, abs: validas.length ? Math.round(ativos / validas.length) : 0 };
      }),
    [coortes, colunas],
  );

  const total = coortes.reduce((s, c) => s + c.clientes, 0);
  const m3 = medias[3]?.taxa ?? 0;
  const m6 = medias[6]?.taxa ?? 0;
  const ultimaCompleta = coortes.filter((c) => c.ativos.length > 3);
  const tendencia = ultimaCompleta.length > 1 ? ultimaCompleta[ultimaCompleta.length - 1].ativos[3] / ultimaCompleta[ultimaCompleta.length - 1].clientes - ultimaCompleta[0].ativos[3] / ultimaCompleta[0].clientes : 0;

  const celula = (valor: number, base: number, ci: number, m: number, rotulo: string) => {
    const ativa = foco?.c === ci && foco?.m === m;
    const taxa = valor / base;
    return (
      <td key={m} className="p-0.5">
        <div
          tabIndex={0}
          aria-label={rotulo}
          onMouseEnter={() => setFoco({ c: ci, m })}
          onFocus={() => setFoco({ c: ci, m })}
          className={`relative flex h-9 min-w-[40px] items-center justify-center overflow-hidden rounded-md text-[11px] tabular-nums outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${ativa ? "ring-2 ring-[var(--fc-text)]" : ""}`}
          style={{ background: `color-mix(in srgb, var(--accent) ${Math.round(8 + taxa * 84)}%, var(--fc-surface-2))` }}
        >
          <span className={`relative ${taxa > 0.5 ? "font-medium text-white" : "text-[var(--fc-text)]"}`}>{modo === "pct" ? pct(taxa) : valor.toLocaleString("pt-BR")}</span>
        </div>
      </td>
    );
  };

  return (
    <div style={{ ...TEMAS[tm], colorScheme: tm === "claro" ? "light" : "dark", "--accent": accent } as CSSProperties} data-tema={tm} className="min-h-full bg-[var(--fc-bg)] p-4 text-[var(--fc-text)] sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-[var(--fc-subtle)]">Retenção de clientes · coortes mensais</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Análise de coorte</h1>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div role="group" aria-label="Formato dos valores" className="inline-flex rounded-lg border border-[var(--fc-border)] bg-[var(--fc-surface)] p-1 shadow-[var(--fc-shadow)]">
            {(
              [
                ["pct", "Percentual"],
                ["abs", "Absoluto"],
              ] as const
            ).map(([m, t]) => (
              <button
                key={m}
                type="button"
                aria-pressed={modo === m}
                onClick={() => setModo(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${modo === m ? "bg-[var(--accent)] text-white" : "text-[var(--fc-muted)] hover:text-[var(--fc-text)]"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <BotaoTema tema={tm} onClick={alternarTema} />
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Clientes analisados", v: total.toLocaleString("pt-BR"), c: "", d: "M16 19v-1a4 4 0 00-8 0v1M12 11a3 3 0 100-6 3 3 0 000 6z" },
          { l: "Retenção no mês 3", v: pct(m3), c: "", d: "M4 12a8 8 0 0114-5.3M20 4v5h-5M20 12a8 8 0 01-14 5.3M4 20v-5h5" },
          { l: "Retenção no mês 6", v: pct(m6), c: "", d: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14H3V6a2 2 0 012-2z" },
          { l: "Tendência (mês 3)", v: `${tendencia >= 0 ? "+" : "−"}${Math.abs(Math.round(tendencia * 1000) / 10).toLocaleString("pt-BR")} p.p.`, c: tendencia >= 0 ? "text-[var(--fc-pos)]" : "text-[var(--fc-neg)]", d: "M3 17l6-6 4 4 8-8M15 7h6v6" },
        ].map((k, i) => (
          <div key={k.l} className="rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-4 shadow-[var(--fc-shadow)]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-[var(--fc-muted)]">{k.l}</p>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: tinta(PALETA[i], 12), color: PALETA[i] }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={k.d} />
                </svg>
              </span>
            </div>
            <p className={`mt-1.5 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${k.c}`}>{k.v}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 rounded-2xl border border-[var(--fc-border)] bg-[var(--fc-surface)] p-3 shadow-[var(--fc-shadow)] sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="text-sm font-medium">Clientes ativos por mês desde a entrada</h2>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--fc-subtle)]" aria-hidden>
            0%
            <span className="relative h-2 w-24 overflow-hidden rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent)_8%,var(--fc-surface-2)),var(--accent))]">
              <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-[var(--fc-border)]" />
            </span>
            100%
          </div>
        </div>
        {janela < colunas && (
          <div className="mb-2 flex items-center justify-between gap-2 px-1 text-xs text-[var(--fc-muted)]">
            <button
              type="button"
              disabled={ini === 0}
              onClick={() => setInicio(Math.max(0, ini - janela))}
              aria-label="Meses anteriores"
              className="grid h-8 w-8 place-items-center rounded-md border border-[var(--fc-border)] text-[var(--fc-muted)] hover:bg-[var(--fc-surface-2)] hover:text-[var(--fc-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] disabled:opacity-30"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <p className="tabular-nums" aria-live="polite">
              Meses M{ini}–M{ini + janela - 1} de M0–M{colunas - 1}
            </p>
            <button
              type="button"
              disabled={ini + janela >= colunas}
              onClick={() => setInicio(Math.min(colunas - janela, ini + janela))}
              aria-label="Próximos meses"
              className="grid h-8 w-8 place-items-center rounded-md border border-[var(--fc-border)] text-[var(--fc-muted)] hover:bg-[var(--fc-surface-2)] hover:text-[var(--fc-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] disabled:opacity-30"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
        <div ref={caixa} className="overflow-x-auto" onMouseLeave={() => setFoco(null)}>
          <table className="w-full border-separate border-spacing-0 text-left text-xs">
            <caption className="sr-only">Retenção por coorte mensal, meses 0 a {colunas - 1}</caption>
            <thead className="text-[var(--fc-subtle)]">
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-[var(--fc-solid)] px-2 py-2 font-medium">Coorte</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Clientes</th>
                {meses.map((m) => (
                  <th key={m} scope="col" className={`px-1 py-2 text-center font-medium tabular-nums ${foco?.m === m ? "text-[var(--accent)]" : ""}`}>
                    M{m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coortes.map((c, ci) => (
                <tr key={c.mes}>
                  <th scope="row" className={`sticky left-0 z-10 bg-[var(--fc-solid)] px-2 py-1 font-medium tabular-nums ${foco?.c === ci ? "text-[var(--accent)]" : "text-[var(--fc-muted)]"}`}>{c.mes}</th>
                  <td className="px-2 py-1 text-right tabular-nums text-[var(--fc-muted)]">{c.clientes.toLocaleString("pt-BR")}</td>
                  {meses.map((m) =>
                    c.ativos[m] !== undefined ? (
                      celula(c.ativos[m], c.clientes, ci, m, `Coorte ${c.mes}, mês ${m}: ${c.ativos[m]} de ${c.clientes} clientes ativos (${pct(c.ativos[m] / c.clientes)})`)
                    ) : (
                      <td key={m} className="p-0.5" aria-hidden>
                        <div className="h-9 rounded-md border border-dashed border-[var(--fc-border)]" />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className="sticky left-0 z-10 border-t border-[var(--fc-border)] bg-[var(--fc-solid)] px-2 pt-3 text-left font-semibold">Média</th>
                <td className="border-t border-[var(--fc-border)] px-2 pt-3 text-right tabular-nums text-[var(--fc-muted)]">{Math.round(total / coortes.length).toLocaleString("pt-BR")}</td>
                {meses.map((m) => (
                  <td key={m} className="border-t border-[var(--fc-border)] px-0.5 pt-3 text-center font-semibold tabular-nums">
                    {modo === "pct" ? pct(medias[m].taxa) : medias[m].abs.toLocaleString("pt-BR")}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-3 px-1 text-[11px] text-[var(--fc-subtle)]">
          Leitura: de cada 100 clientes que entram, cerca de {Math.round(m6 * 100)} continuam ativos depois de 6 meses. Média ponderada pelo tamanho da coorte.
        </p>
      </section>

      <footer className="mt-6 flex justify-end">
        <a href="https://flowcoresolucoes.com.br/codigos" target="_blank" rel="noopener" className="text-[11px] text-[var(--fc-subtle)] transition-colors hover:text-[var(--fc-text)]">
          Criado por FlowCore Soluções LTDA
        </a>
      </footer>
    </div>
  );
}
