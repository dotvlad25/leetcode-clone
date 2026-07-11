import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import Editor from "@monaco-editor/react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Play, Send, Brain, ChevronLeft, CheckCircle2, XCircle,
  Clock, AlertTriangle, Loader2, History, BarChart3, Terminal,
  Code2, FlaskConical, ChevronDown, BookOpen, Lightbulb,
} from "lucide-react";
import { Streamdown } from "streamdown";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";

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

type TestResult = {
  id: number;
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
};

type AIAnalysis = {
  overall: string;
  correctness: { score: number; feedback: string };
  timeComplexity: { notation: string; explanation: string };
  spaceComplexity: { notation: string; explanation: string };
  styleIssues: string[];
  improvements: string[];
  optimizedApproach: string;
};

// ── Terminal / Output Tab ──────────────────────────────────────────────────────
function TerminalPanel({ output, isRunning }: { output: string; isRunning: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d] font-mono text-xs">
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {!output && !isRunning ? (
          <p className="text-[#555] select-none">$ Run or Submit to see output here...</p>
        ) : (
          output.split("\n").map((line, i) => {
            const isPass = line.startsWith("✅");
            const isFail = line.startsWith("❌");
            const isExpected = line.trim().startsWith("Expected:");
            const isGot = line.trim().startsWith("Got:");
            const isError = line.trim().startsWith("Error:");
            const color = isPass
              ? "text-[oklch(0.72_0.18_145)]"
              : isFail
              ? "text-[oklch(0.65_0.22_25)]"
              : isExpected
              ? "text-[oklch(0.72_0.18_145)]"
              : isGot || isError
              ? "text-[oklch(0.65_0.22_25)]"
              : "text-[#ccc]";
            return (
              <div key={i} className={`leading-5 whitespace-pre-wrap break-all ${color}`}>
                {line || "\u00a0"}
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── Test Result Panel ──────────────────────────────────────────────────────────
function TestResultPanel({ results, status }: { results: TestResult[]; status: string | null }) {
  if (!results.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-16">
        <Play className="w-10 h-10 opacity-30" />
        <p className="text-sm">Run your code to see test results</p>
      </div>
    );
  }
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;
  return (
    <div className="p-4 space-y-3">
      <div className={`flex items-center gap-3 p-3 rounded-lg ${allPassed ? "test-pass" : "test-fail"}`}>
        {allPassed ? (
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-destructive shrink-0" />
        )}
        <div>
          <p className={`font-semibold text-sm ${allPassed ? "text-primary" : "text-destructive"}`}>
            {allPassed ? (status === "accepted" ? "Accepted" : "All Tests Passed") : `${passed}/${total} Tests Passed`}
          </p>
          <p className="text-xs text-muted-foreground">{passed} passed · {total - passed} failed</p>
        </div>
      </div>
      {results.map((r, i) => (
        <div key={r.id} className={`rounded-lg p-3 space-y-2 ${r.passed ? "test-pass" : "test-fail"}`}>
          <div className="flex items-center gap-2">
            {r.passed ? (
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive shrink-0" />
            )}
            <span className="text-sm font-medium text-foreground">
              Case {i + 1}: {r.description}
            </span>
          </div>
          {!r.passed && (
            <div className="space-y-1 pl-6 text-xs font-mono">
              <div className="flex gap-2">
                <span className="text-muted-foreground shrink-0">Expected:</span>
                <span className="text-primary break-all">{r.expected}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground shrink-0">Actual:</span>
                <span className="text-destructive break-all">{r.actual || "null"}</span>
              </div>
              {r.error && (
                <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive whitespace-pre-wrap">
                  {r.error}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── AI Analysis Panel ──────────────────────────────────────────────────────────
function AIAnalysisPanel({ analysis, isLoading }: { analysis: AIAnalysis | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Analyzing your solution...</p>
      </div>
    );
  }
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-16">
        <Brain className="w-10 h-10 opacity-30" />
        <p className="text-sm">Click "AI Analysis" to get feedback on your solution</p>
      </div>
    );
  }
  const scoreColor = analysis.correctness.score >= 8 ? "text-primary" : analysis.correctness.score >= 5 ? "text-medium" : "text-destructive";
  return (
    <div className="p-4 space-y-4">
      <div className="p-3 rounded-lg bg-secondary/50 border border-border">
        <p className="text-sm text-foreground leading-relaxed">{analysis.overall}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-card border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">Correctness</p>
          <p className={`text-2xl font-bold ${scoreColor}`}>{analysis.correctness.score}<span className="text-sm text-muted-foreground">/10</span></p>
        </div>
        <div className="p-3 rounded-lg bg-card border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">Time</p>
          <p className="text-lg font-bold text-foreground font-mono">{analysis.timeComplexity.notation}</p>
        </div>
        <div className="p-3 rounded-lg bg-card border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">Space</p>
          <p className="text-lg font-bold text-foreground font-mono">{analysis.spaceComplexity.notation}</p>
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Correctness</h4>
        <p className="text-sm text-foreground">{analysis.correctness.feedback}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time Complexity</h4>
          <p className="text-sm text-foreground">{analysis.timeComplexity.explanation}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Space Complexity</h4>
          <p className="text-sm text-foreground">{analysis.spaceComplexity.explanation}</p>
        </div>
      </div>
      {analysis.improvements.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Improvements</h4>
          <ul className="space-y-1">
            {analysis.improvements.map((imp, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="text-primary shrink-0">•</span>{imp}
              </li>
            ))}
          </ul>
        </div>
      )}
      {analysis.styleIssues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Style Issues</h4>
          <ul className="space-y-1">
            {analysis.styleIssues.map((issue, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <AlertTriangle className="w-3.5 h-3.5 text-medium shrink-0 mt-0.5" />{issue}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Optimal Approach</h4>
        <p className="text-sm text-foreground">{analysis.optimizedApproach}</p>
      </div>
    </div>
  );
}

// ── Submission History Panel ───────────────────────────────────────────────────
function SubmissionHistoryPanel({ slug }: { slug: string }) {
  const { isAuthenticated } = useAuth();
  const { data: history, isLoading } = trpc.problems.submissionHistory.useQuery(
    { slug },
    { enabled: isAuthenticated }
  );
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-16">
        <History className="w-10 h-10 opacity-30" />
        <p className="text-sm">Sign in to view your submission history</p>
        <Button size="sm" onClick={() => startLogin()}>Sign In</Button>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  if (!history?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-16">
        <History className="w-10 h-10 opacity-30" />
        <p className="text-sm">No submissions yet</p>
      </div>
    );
  }
  return (
    <div className="p-4 space-y-3">
      {history.map((sub) => {
        const passed = sub.testResults.filter((r: TestResult) => r.passed).length;
        const total = sub.testResults.length;
        return (
          <div key={sub.id} className={`p-3 rounded-lg border ${sub.status === "accepted" ? "test-pass" : "test-fail"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {sub.status === "accepted" ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className={`text-sm font-medium capitalize ${sub.status === "accepted" ? "text-primary" : "text-destructive"}`}>
                  {sub.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="w-3 h-3" />
                {passed}/{total} tests
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(sub.createdAt).toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ProblemDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();

  const { data: problem, isLoading } = trpc.problems.getBySlug.useQuery({ slug });
  const [code, setCode] = useState<string>("");
  const [editorTab, setEditorTab] = useState<"solution" | "tests">("solution");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState("output");
  const [terminalOutput, setTerminalOutput] = useState<string>("");
  const [bottomOpen, setBottomOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<"instructions" | "solution">("instructions");
  const bottomPanelRef = useRef<ImperativePanelHandle>(null);

  // Lock page scroll while on this page
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  const handleEditorMount = useCallback(
    (_editor: unknown, _monaco: unknown) => {
      if (problem && !code) setCode(problem.starterCode);
    },
    [problem, code]
  );

  const runMutation = trpc.problems.runTests.useMutation({
    onSuccess: (data) => {
      setTestResults(data.results);
      setTerminalOutput(data.terminalOutput);
      setActiveBottomTab("output");
      bottomPanelRef.current?.expand();
      setBottomOpen(true);
      const passed = data.results.filter((r) => r.passed).length;
      const total = data.results.length;
      if (passed === total) toast.success(`All ${total} tests passed!`);
      else toast.error(`${passed}/${total} tests passed`);
    },
    onError: (err) => toast.error(`Execution error: ${err.message}`),
  });

  const submitMutation = trpc.problems.submit.useMutation({
    onSuccess: (data) => {
      setTestResults(data.results);
      setSubmitStatus(data.status);
      setTerminalOutput(data.terminalOutput);
      setActiveBottomTab("output");
      bottomPanelRef.current?.expand();
      setBottomOpen(true);
      if (data.status === "accepted") toast.success("Accepted! All tests passed.");
      else toast.error("Wrong Answer — check your test results.");
    },
    onError: (err) => toast.error(`Submit error: ${err.message}`),
  });

  const analyzeMutation = trpc.problems.analyzeCode.useMutation({
    onSuccess: (data) => {
      setAiAnalysis(data as AIAnalysis);
      setActiveBottomTab("ai");
      bottomPanelRef.current?.expand();
      setBottomOpen(true);
    },
    onError: (err) => toast.error(`AI analysis error: ${err.message}`),
  });

  const currentCode = code || problem?.starterCode || "";
  const isRunning = runMutation.isPending || submitMutation.isPending;
  const isAnalyzing = analyzeMutation.isPending;

  const handleRun = () => {
    if (!currentCode.trim()) return toast.error("Write some code first!");
    setTerminalOutput("");
    runMutation.mutate({ slug, code: currentCode });
  };

  const handleSubmit = () => {
    if (!isAuthenticated) { startLogin(); return; }
    if (!currentCode.trim()) return toast.error("Write some code first!");
    setTerminalOutput("");
    submitMutation.mutate({ slug, code: currentCode });
  };

  const handleAnalyze = () => {
    if (!currentCode.trim()) return toast.error("Write some code first!");
    setActiveBottomTab("ai");
    analyzeMutation.mutate({ slug, code: currentCode });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
        <div className="container py-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
        <div className="container py-16 text-center">
          <h2 className="text-xl font-semibold">Problem not found</h2>
          <Link href="/problems">
            <Button className="mt-4" variant="outline">Back to Problems</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Main split layout */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">

          {/* Left: Problem description */}
          <ResizablePanel defaultSize={42} minSize={25} maxSize={65}>
            <div className="h-full flex flex-col overflow-hidden">
              {/* Top strip: Back + Instructions / Solution tabs */}
              <div className="shrink-0 flex items-center gap-1 border-b border-[#2d2d2d] bg-[#1a1a1a] px-2 h-10">
                <Link href="/problems">
                  <button className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-[#2d2d2d] transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Problems</span>
                  </button>
                </Link>
                <div className="w-px h-4 bg-[#3a3a3a] mx-1" />
                <button
                  onClick={() => setLeftTab("instructions")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    leftTab === "instructions"
                      ? "bg-[#2d2d2d] text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#252525]"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Instructions
                </button>
                <button
                  onClick={() => setLeftTab("solution")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    leftTab === "solution"
                      ? "bg-[#2d2d2d] text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#252525]"
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  Solution
                  {!problem.solution && (
                    <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">soon</span>
                  )}
                </button>
              </div>
              {/* Content area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-5">
                {leftTab === "instructions" ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown shikiTheme={["github-dark-default", "github-dark-default"]}>{problem.description}</Streamdown>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {problem.solution ? (
                      <>
                        {/* Solution explanation */}
                        {problem.solutionExplanation && (
                          <div className="prose prose-sm prose-invert max-w-none">
                            <Streamdown shikiTheme={["github-dark-default", "github-dark-default"]}>{problem.solutionExplanation}</Streamdown>
                          </div>
                        )}
                        {/* Solution code */}
                        <div className="rounded-lg overflow-hidden border border-[#3a3a3a]">
                          <div className="flex items-center gap-2 px-3 py-2 bg-[#252526] border-b border-[#3a3a3a]">
                            <Code2 className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">solution.py</span>
                          </div>
                          <Editor
                            height="400px"
                            defaultLanguage="python"
                            language="python"
                            value={problem.solution}
                            theme="vs-dark"
                            options={{
                              fontSize: 13,
                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              lineNumbers: "on",
                              readOnly: true,
                              domReadOnly: true,
                              wordWrap: "on",
                              padding: { top: 10, bottom: 10 },
                              scrollbar: { vertical: "hidden", alwaysConsumeMouseWheel: false },
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
                        <Lightbulb className="w-12 h-12 opacity-20" />
                        <p className="text-sm">Solution coming soon</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />

          {/* Right: Editor (top) + single collapsible bottom panel */}
          <ResizablePanel defaultSize={58} minSize={35}>
            <ResizablePanelGroup direction="vertical" className="h-full w-full">

              {/* Editor panel */}
              <ResizablePanel defaultSize={65} minSize={15}>
                <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
                  {/* Editor tab bar */}
                  <div className="flex items-center border-b border-[#2d2d2d] bg-[#252526] shrink-0 px-1">
                    <Link href="/problems">
                      <button className="flex items-center gap-1 px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                    <div className="w-px h-4 bg-[#3a3a3a] mx-1" />
                    <button
                      onClick={() => setEditorTab("solution")}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
                        editorTab === "solution"
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      solution.py
                    </button>
                    <button
                      onClick={() => setEditorTab("tests")}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
                        editorTab === "tests"
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      test_cases.py
                      <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">read-only</span>
                    </button>
                    {/* Action buttons */}
                    <div className="ml-auto flex items-center gap-1 pr-2">
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-[#2d2d2d] transition-colors disabled:opacity-50"
                      >
                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                        AI
                      </button>
                      <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-[#2d2d2d] transition-colors disabled:opacity-50"
                      >
                        {isRunning && runMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        Run
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isRunning}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] bg-primary/90 text-primary-foreground hover:bg-primary transition-colors disabled:opacity-50"
                      >
                        {isRunning && submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Submit
                      </button>
                    </div>
                  </div>

                  {/* Monaco editor */}
                  <div className="flex-1 overflow-hidden">
                    {/* ... monaco editors ... */}
                    {editorTab === "solution" ? (
                      <Editor
                        height="100%"
                        defaultLanguage="python"
                        language="python"
                        value={currentCode}
                        onChange={(val) => setCode(val ?? "")}
                        onMount={handleEditorMount}
                        theme="vs-dark"
                        options={{
                          fontSize: 14,
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          fontLigatures: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          lineNumbers: "on",
                          renderLineHighlight: "line",
                          tabSize: 4,
                          insertSpaces: true,
                          wordWrap: "on",
                          padding: { top: 12, bottom: 12 },
                          smoothScrolling: true,
                          cursorBlinking: "smooth",
                          bracketPairColorization: { enabled: true },
                        }}
                      />
                    ) : (
                      <Editor
                        height="100%"
                        defaultLanguage="python"
                        language="python"
                        value={problem.unitTestCode ?? "# Unit tests not available"}
                        theme="vs-dark"
                        options={{
                          fontSize: 13,
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          fontLigatures: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          lineNumbers: "on",
                          readOnly: true,
                          renderLineHighlight: "line",
                          tabSize: 4,
                          wordWrap: "on",
                          padding: { top: 12, bottom: 12 },
                          smoothScrolling: true,
                          cursorStyle: "line-thin",
                          domReadOnly: true,
                        }}
                      />
                    )}
                  </div>

                  {/* Always-visible bottom tab strip — stays visible even when panel is collapsed */}
                  <div className="shrink-0 border-t border-[#2d2d2d] bg-[#252526]">
                    <Tabs value={activeBottomTab} onValueChange={(v) => {
                      setActiveBottomTab(v);
                      // If panel is collapsed, expand it when a tab is clicked
                      if (!bottomOpen) {
                        bottomPanelRef.current?.expand();
                        setBottomOpen(true);
                      }
                    }}>
                      <TabsList className="w-full justify-start rounded-none bg-transparent h-9 px-2 gap-0">
                        {/* Chevron toggle */}
                        <button
                          onClick={() => {
                            if (bottomOpen) {
                              bottomPanelRef.current?.collapse();
                            } else {
                              bottomPanelRef.current?.expand();
                            }
                          }}
                          className="p-1 rounded hover:bg-[#3a3a3a] transition-colors mr-2 shrink-0"
                          title={bottomOpen ? "Collapse panel" : "Expand panel"}
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                              bottomOpen ? "" : "rotate-180"
                            }`}
                          />
                        </button>
                        <TabsTrigger
                          value="output"
                          className="text-xs data-[state=active]:text-foreground data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground rounded-none pt-1 px-3 h-full"
                        >
                          <Terminal className="w-3 h-3 mr-1.5" />
                          Output
                          {isRunning && <Loader2 className="w-3 h-3 ml-1.5 animate-spin text-primary" />}
                        </TabsTrigger>
                        <TabsTrigger
                          value="tests"
                          className="text-xs data-[state=active]:text-foreground data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground rounded-none pt-1 px-3 h-full"
                        >
                          Test Results
                          {testResults.length > 0 && (
                            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${testResults.every(r => r.passed) ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                              {testResults.filter(r => r.passed).length}/{testResults.length}
                            </span>
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          value="ai"
                          className="text-xs data-[state=active]:text-foreground data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground rounded-none pt-1 px-3 h-full"
                        >
                          AI Analysis
                        </TabsTrigger>
                        <TabsTrigger
                          value="history"
                          className="text-xs data-[state=active]:text-foreground data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground rounded-none pt-1 px-3 h-full"
                        >
                          History
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </ResizablePanel>

              {/* Single collapsible bottom panel with all tabs */}
              <ResizablePanel
                ref={bottomPanelRef}
                collapsible
                collapsedSize={0}
                defaultSize={0}
                minSize={20}
                onCollapse={() => setBottomOpen(false)}
                onExpand={() => setBottomOpen(true)}
              >
                {/* Only the content area is inside the collapsible panel */}
                <Tabs value={activeBottomTab} onValueChange={setActiveBottomTab} className="h-full flex flex-col">
                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="output" className="h-full m-0 overflow-hidden">
                      <TerminalPanel output={terminalOutput} isRunning={isRunning} />
                    </TabsContent>
                    <TabsContent value="tests" className="h-full m-0 overflow-hidden">
                      <div className="h-full overflow-y-auto overflow-x-hidden">
                        <TestResultPanel results={testResults} status={submitStatus} />
                      </div>
                    </TabsContent>
                    <TabsContent value="ai" className="h-full m-0 overflow-hidden">
                      <div className="h-full overflow-y-auto overflow-x-hidden">
                        <AIAnalysisPanel analysis={aiAnalysis} isLoading={isAnalyzing} />
                      </div>
                    </TabsContent>
                    <TabsContent value="history" className="h-full m-0 overflow-hidden">
                      <div className="h-full overflow-y-auto overflow-x-hidden">
                        <SubmissionHistoryPanel slug={slug} />
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </ResizablePanel>

            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
