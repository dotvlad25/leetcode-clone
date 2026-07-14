import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import NavBar from "@/components/NavBar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, Layers } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cls =
    difficulty === "Easy" ? "badge-easy" :
    difficulty === "Medium" ? "badge-medium" : "badge-hard";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {difficulty}
    </span>
  );
}

export default function Problems() {
  const { data: problems, isLoading } = trpc.problems.list.useQuery();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Problems</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {problems ? `${problems.length} problem${problems.length !== 1 ? "s" : ""} available` : "Loading..."}
            </p>
          </div>

          {/* Table header */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-[2rem_1fr_7rem_7rem] gap-4 px-5 py-3 bg-secondary/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div>Status</div>
              <div>Title</div>
              <div>Difficulty</div>
              <div className="text-right">Acceptance</div>
            </div>

            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[2rem_1fr_7rem_7rem] gap-4 px-5 py-4 border-b border-border last:border-0">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-12 ml-auto" />
                </div>
              ))
            ) : problems?.length === 0 ? (
              <div className="px-5 py-12 text-center text-muted-foreground">No problems available yet.</div>
            ) : (
              problems?.map((p, idx) => (
                <Link key={p.id} href={`/problems/${p.slug}`}>
                  <div className="grid grid-cols-[2rem_1fr_7rem_7rem] gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-secondary/30 cursor-pointer transition-colors group">
                    <div className="flex items-center">
                      {p.solved ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>
                  <div className="flex items-center gap-2">
                     <span className="text-sm text-muted-foreground">{p.number > 0 ? p.number : idx + 1}.</span>
                     <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                       {p.title}
                     </span>
                     {p.isStaged ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-blue-500/40 text-blue-400 bg-blue-500/10 leading-none">
                        STAGED
                      </span>
                    ) : null}
                   </div>
                    <div className="flex items-center">
                      <DifficultyBadge difficulty={p.difficulty} />
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
