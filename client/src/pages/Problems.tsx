import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import NavBar from "@/components/NavBar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Layers, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Badge / style maps ─────────────────────────────────────────────────────
const BADGE_STYLES: Record<string, { label: string; cls: string; activeCls: string }> = {
  anth:  { label: "Anthropic", cls: "border-orange-500/40 text-orange-400 bg-orange-500/10",  activeCls: "border-orange-500 text-orange-300 bg-orange-500/25" },
  figma: { label: "Figma",     cls: "border-purple-500/40 text-purple-400 bg-purple-500/10", activeCls: "border-purple-500 text-purple-300 bg-purple-500/25" },
  google: { label: "Google",   cls: "border-blue-500/40 text-blue-400 bg-blue-500/10",        activeCls: "border-blue-500 text-blue-300 bg-blue-500/25" },
  msft:  { label: "Microsoft", cls: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",        activeCls: "border-cyan-500 text-cyan-300 bg-cyan-500/25" },
  amazon: { label: "Amazon",   cls: "border-amber-500/40 text-amber-400 bg-amber-500/10",     activeCls: "border-amber-500 text-amber-300 bg-amber-500/25" },
};

const DIFFICULTY_STYLES: Record<string, { cls: string; activeCls: string }> = {
  Easy:   { cls: "border-green-500/40  text-green-400  bg-green-500/10",  activeCls: "border-green-500  text-green-300  bg-green-500/25"  },
  Medium: { cls: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10", activeCls: "border-yellow-500 text-yellow-300 bg-yellow-500/25" },
  Hard:   { cls: "border-red-500/40    text-red-400    bg-red-500/10",    activeCls: "border-red-500    text-red-300    bg-red-500/25"    },
};

// ── Sub-components ─────────────────────────────────────────────────────────
function CompanyBadges({ badges }: { badges?: string | null }) {
  if (!badges) return null;
  const list = badges.split(",").map(b => b.trim()).filter(Boolean);
  return (
    <>
      {list.map(b => {
        const style = BADGE_STYLES[b] ?? { label: b, cls: "border-muted text-muted-foreground bg-muted/20", activeCls: "" };
        return (
          <span key={b} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${style.cls} leading-none`}>
            {style.label}
          </span>
        );
      })}
    </>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cls =
    difficulty === "Easy"   ? "badge-easy" :
    difficulty === "Medium" ? "badge-medium" : "badge-hard";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {difficulty}
    </span>
  );
}

// ── Filter pill button ─────────────────────────────────────────────────────
function FilterPill({
  label,
  active,
  cls,
  activeCls,
  onClick,
}: {
  label: string;
  active: boolean;
  cls: string;
  activeCls: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer select-none ${
        active ? activeCls : cls
      } hover:opacity-90 active:scale-95`}
    >
      {label}
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Problems() {
  const { data: problems, isLoading } = trpc.problems.list.useQuery();
  const { user } = useAuth();

  // Filter state
  const [companies, setCompanies] = useState<Set<string>>(new Set());
  const [difficulties, setDifficulties] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"all" | "solved" | "unsolved">("all");

  // Derive available company keys from loaded problems
  const availableCompanies = useMemo(() => {
    if (!problems) return [];
    const keys = new Set<string>();
    for (const p of problems) {
      if (p.badges) p.badges.split(",").map(b => b.trim()).filter(Boolean).forEach(b => keys.add(b));
    }
    // Return in a stable order: known badges first, then unknown
    const known = Object.keys(BADGE_STYLES).filter(k => keys.has(k));
    const unknown = Array.from(keys).filter(k => !BADGE_STYLES[k]);
    return [...known, ...unknown];
  }, [problems]);

  // Toggle helpers
  function toggleCompany(key: string) {
    setCompanies(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  function toggleDifficulty(d: string) {
    setDifficulties(prev => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  }
  function clearAll() {
    setCompanies(new Set());
    setDifficulties(new Set());
    setStatus("all");
  }

  const hasActiveFilters = companies.size > 0 || difficulties.size > 0 || status !== "all";

  // Filtered list
  const filtered = useMemo(() => {
    if (!problems) return [];
    return problems.filter(p => {
      // Company filter: problem must have at least one of the selected company badges
      if (companies.size > 0) {
        const pBadges = p.badges ? p.badges.split(",").map(b => b.trim()) : [];
        if (!pBadges.some(b => companies.has(b))) return false;
      }
      // Difficulty filter
      if (difficulties.size > 0 && !difficulties.has(p.difficulty)) return false;
      // Status filter
      if (status === "solved" && !p.solved) return false;
      if (status === "unsolved" && p.solved) return false;
      return true;
    });
  }, [problems, companies, difficulties, status]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-foreground">Problems</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {problems
                ? hasActiveFilters
                  ? `${filtered.length} of ${problems.length} problem${problems.length !== 1 ? "s" : ""}`
                  : `${problems.length} problem${problems.length !== 1 ? "s" : ""} available`
                : "Loading..."}
            </p>
          </div>

          {/* ── Filter bar ─────────────────────────────────────────────── */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {/* Company pills */}
            {availableCompanies.map(key => {
              const style = BADGE_STYLES[key] ?? {
                label: key,
                cls: "border-muted text-muted-foreground bg-muted/20",
                activeCls: "border-muted text-foreground bg-muted/40",
              };
              return (
                <FilterPill
                  key={key}
                  label={style.label}
                  active={companies.has(key)}
                  cls={style.cls}
                  activeCls={style.activeCls}
                  onClick={() => toggleCompany(key)}
                />
              );
            })}

            {/* Divider */}
            {availableCompanies.length > 0 && (
              <span className="h-4 w-px bg-border mx-1" />
            )}

            {/* Difficulty pills */}
            {(["Easy", "Medium", "Hard"] as const).map(d => (
              <FilterPill
                key={d}
                label={d}
                active={difficulties.has(d)}
                cls={DIFFICULTY_STYLES[d].cls}
                activeCls={DIFFICULTY_STYLES[d].activeCls}
                onClick={() => toggleDifficulty(d)}
              />
            ))}

            {/* Divider */}
            <span className="h-4 w-px bg-border mx-1" />

            {/* Status pills */}
            {(["all", "solved", "unsolved"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                  status === s
                    ? "border-primary/60 text-primary bg-primary/15"
                    : "border-muted/50 text-muted-foreground bg-transparent hover:border-muted hover:text-foreground"
                }`}
              >
                {s === "all" ? "All" : s === "solved" ? "Solved" : "Unsolved"}
              </button>
            ))}

            {/* Clear button */}
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="ml-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {/* ── Table ──────────────────────────────────────────────────── */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-[2rem_1fr_7rem_6rem_7rem] gap-4 px-5 py-3 bg-secondary/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div>Status</div>
              <div>Title</div>
              <div>Difficulty</div>
              <div className="text-right">Frequency</div>
              <div className="text-right">Progress</div>
            </div>

            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[2rem_1fr_7rem_6rem_7rem] gap-4 px-5 py-4 border-b border-border last:border-0">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-10 ml-auto" />
                  <Skeleton className="h-4 w-12 ml-auto" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-muted-foreground">
                {hasActiveFilters ? (
                  <span>
                    No problems match your filters.{" "}
                    <button onClick={clearAll} className="text-primary underline cursor-pointer">
                      Clear filters
                    </button>
                  </span>
                ) : (
                  "No problems available yet."
                )}
              </div>
            ) : (
              filtered.map((p, idx) => (
                <Link key={p.id} href={`/problems/${p.slug}`}>
                  <div className="grid grid-cols-[2rem_1fr_7rem_6rem_7rem] gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-secondary/30 cursor-pointer transition-colors group">
                    <div className="flex items-center">
                      {p.solved ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">{p.number > 0 ? p.number : idx + 1}.</span>
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {p.title}
                      </span>
                      {p.isStaged ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-blue-500/40 text-blue-400 bg-blue-500/10 leading-none">
                          STAGED
                        </span>
                      ) : null}
                      <CompanyBadges badges={p.badges} />
                    </div>
                    <div className="flex items-center">
                      <DifficultyBadge difficulty={p.difficulty} />
                    </div>
                    <div className="flex items-center justify-end text-xs tabular-nums text-muted-foreground/70">
                      {p.frequency != null ? (
                        <span title="Number of times reported in interviews">{p.frequency.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground/30">N/A</span>
                      )}
                    </div>
                    <div className="flex items-center justify-end text-sm text-muted-foreground">
                      {p.isStaged && p.stageProgress ? (
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className={`text-xs font-medium tabular-nums ${
                            p.stageProgress.completedStages.length === p.stageProgress.totalStages && p.stageProgress.totalStages > 0
                              ? "text-primary"
                              : p.stageProgress.completedStages.length > 0
                              ? "text-blue-400"
                              : "text-muted-foreground"
                          }`}>
                            {p.stageProgress.completedStages.length}/{p.stageProgress.totalStages}
                          </span>
                        </div>
                      ) : p.isStaged ? (
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                          <span className="text-xs text-muted-foreground/40">
                            {user ? "0/?" : "—"}
                          </span>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
