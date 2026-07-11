import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { Code2, Zap, Brain, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="container py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <Code2 className="w-4 h-4" />
            Python Practice Platform
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            Master Python<br />
            <span className="text-primary">One Problem at a Time</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Practice coding problems with a real Python execution engine, automated unit tests, and AI-powered feedback on your solutions.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/problems">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8">
                Start Practicing
              </Button>
            </Link>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 text-left">
            {[
              { icon: <Zap className="w-5 h-5 text-primary" />, title: "Live Execution", desc: "Run your Python code server-side with real output and error messages." },
              { icon: <CheckCircle2 className="w-5 h-5 text-primary" />, title: "Unit Tests", desc: "Each problem ships with pre-built test cases. See exactly which pass or fail." },
              { icon: <Brain className="w-5 h-5 text-primary" />, title: "AI Analysis", desc: "Get AI feedback on correctness, time/space complexity, and style." },
            ].map((f) => (
              <div key={f.title} className="p-5 rounded-lg bg-card border border-border space-y-2">
                {f.icon}
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
