import { useState, useCallback } from "react";
import { useParams, Link } from "wouter";
import Editor from "@monaco-editor/react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Play, Send, Brain, ChevronLeft, CheckCircle2, XCircle,
  Clock, AlertTriangle, Loader2, History, BarChart3,
} from "lucide-react";
import { Streamdown } from "streamdown";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

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
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      {/* Summary */}
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

      {/* Individual test cases */}
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
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Overall */}
      <div className="p-3 rounded-lg bg-secondary/50 border border-border">
        <p className="text-sm text-foreground leading-relaxed">{analysis.overall}</p>
      </div>

      {/* Score + Complexity */}
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

      {/* Correctness feedback */}
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Correctness</h4>
        <p className="text-sm text-foreground">{analysis.correctness.feedback}</p>
      </div>

      {/* Complexity explanations */}
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

      {/* Improvements */}
      {analysis.improvements.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Improvements</h4>
          <ul className="space-y-1">
            {analysis.improvements.map((imp, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="text-primary shrink-0">•</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Style issues */}
      {analysis.styleIssues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Style Issues</h4>
          <ul className="space-y-1">
            {analysis.styleIssues.map((issue, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <AlertTriangle className="w-3.5 h-3.5 text-medium shrink-0 mt-0.5" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Optimal approach */}
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Optimal Approach</h4>
        <p className="text-sm text-foreground">{analysis.optimizedApproach}</p>
      </div>
    </div>
  );
}

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
    <div className="p-4 space-y-3 overflow-y-auto h-full">
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

export default function ProblemDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();

  const { data: problem, isLoading } = trpc.problems.getBySlug.useQuery({ slug });
  const [code, setCode] = useState<string>("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState("tests");

  // Set starter code once problem loads
  const handleEditorMount = useCallback(
    (_editor: unknown, _monaco: unknown) => {
      if (problem && !code) {
        setCode(problem.starterCode);
      }
    },
    [problem, code]
  );

  // Derive method name from starter code
  const methodName = (() => {
    if (!problem) return "findDuplicate";
    const match = problem.starterCode.match(/def\s+(\w+)\s*\(/);
    return match ? match[1] : "findDuplicate";
  })();

  const runMutation = trpc.problems.runTests.useMutation({
    onSuccess: (data) => {
      setTestResults(data.results);
      setActiveBottomTab("tests");
      const passed = data.results.filter((r) => r.passed).length;
      const total = data.results.length;
      if (passed === total) {
        toast.success(`All ${total} tests passed!`);
      } else {
        toast.error(`${passed}/${total} tests passed`);
      }
    },
    onError: (err) => toast.error(`Execution error: ${err.message}`),
  });

  const submitMutation = trpc.problems.submit.useMutation({
    onSuccess: (data) => {
      setTestResults(data.results);
      setSubmitStatus(data.status);
      setActiveBottomTab("tests");
      if (data.status === "accepted") {
        toast.success("Accepted! All tests passed.");
      } else {
        toast.error("Wrong Answer — check your test results.");
      }
    },
    onError: (err) => toast.error(`Submit error: ${err.message}`),
  });

  const analyzeMutation = trpc.problems.analyzeCode.useMutation({
    onSuccess: (data) => {
      setAiAnalysis(data as AIAnalysis);
      setActiveBottomTab("ai");
    },
    onError: (err) => toast.error(`AI analysis error: ${err.message}`),
  });

  const currentCode = code || problem?.starterCode || "";

  const handleRun = () => {
    if (!currentCode.trim()) return toast.error("Write some code first!");
    runMutation.mutate({ slug, code: currentCode });
  };

  const handleSubmit = () => {
    if (!isAuthenticated) { startLogin(); return; }
    if (!currentCode.trim()) return toast.error("Write some code first!");
    submitMutation.mutate({ slug, code: currentCode });
  };

  const handleAnalyze = () => {
    if (!currentCode.trim()) return toast.error("Write some code first!");
    setActiveBottomTab("ai");
    analyzeMutation.mutate({ slug, code: currentCode });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
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
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <div className="container py-16 text-center">
          <h2 className="text-xl font-semibold text-foreground">Problem not found</h2>
          <Link href="/problems">
            <Button className="mt-4" variant="outline">Back to Problems</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isRunning = runMutation.isPending || submitMutation.isPending;
  const isAnalyzing = analyzeMutation.isPending;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavBar />

      {/* Top bar */}
      <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/problems">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1 px-2">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Problems</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-semibold text-foreground truncate max-w-xs">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="gap-1.5 border-border text-muted-foreground hover:text-foreground"
          >
            {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
            AI Analysis
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRun}
            disabled={isRunning}
            className="gap-1.5 border-border text-muted-foreground hover:text-foreground"
          >
            {isRunning && runMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isRunning}
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isRunning && submitMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit
          </Button>
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex-1 overflow-hidden" style={{ height: "calc(100vh - 7rem)" }}>
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left panel: Problem description */}
          <ResizablePanel defaultSize={45} minSize={25} maxSize={70}>
            <div className="h-full overflow-y-auto p-5">
              <div className="prose prose-sm prose-invert max-w-none">
                <Streamdown>{problem.description}</Streamdown>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />

          {/* Right panel: Editor + Results */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Editor */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <div className="h-full bg-[#1e1e1e]">
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    language="python"
                    value={code || problem.starterCode}
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
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />

              {/* Bottom tabs: Test Results / AI Analysis / History */}
              <ResizablePanel defaultSize={40} minSize={20}>
                <div className="h-full border-t border-border bg-card flex flex-col">
                  <Tabs value={activeBottomTab} onValueChange={setActiveBottomTab} className="h-full flex flex-col">
                    <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-10 px-2 gap-1 shrink-0">
                      <TabsTrigger
                        value="tests"
                        className="text-xs data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2"
                      >
                        Test Results
                        {testResults.length > 0 && (
                          <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${testResults.every(r => r.passed) ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                            {testResults.filter(r => r.passed).length}/{testResults.length}
                          </span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="ai"
                        className="text-xs data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2"
                      >
                        AI Analysis
                      </TabsTrigger>
                      <TabsTrigger
                        value="history"
                        className="text-xs data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2"
                      >
                        History
                      </TabsTrigger>
                    </TabsList>
                    <div className="flex-1 overflow-hidden">
                      <TabsContent value="tests" className="h-full m-0 overflow-hidden">
                        <TestResultPanel results={testResults} status={submitStatus} />
                      </TabsContent>
                      <TabsContent value="ai" className="h-full m-0 overflow-hidden">
                        <AIAnalysisPanel analysis={aiAnalysis} isLoading={isAnalyzing} />
                      </TabsContent>
                      <TabsContent value="history" className="h-full m-0 overflow-hidden">
                        <SubmissionHistoryPanel slug={slug} />
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
