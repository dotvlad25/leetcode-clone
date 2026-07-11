import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Code2, LogOut, User } from "lucide-react";

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
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

        {/* Auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user?.name ?? "User"}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => startLogin()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
