import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Code2, User } from "lucide-react";

export default function NavBar() {
  const { user } = useAuth();
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="container flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <Code2 className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">PyCode</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link href="/problems">
            <Button
              variant="ghost"
              size="sm"
              className={location.startsWith("/problems") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}
            >
              Problems
            </Button>
          </Link>
        </div>

        {/* Local user — running locally there is no sign-in step */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{user?.name ?? "Local User"}</span>
        </div>
      </div>
    </nav>
  );
}
