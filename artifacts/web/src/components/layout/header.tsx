import { Link, useLocation } from "wouter";
import { Github, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL;

export function Header() {
  const [location] = useLocation();

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <img
              src={`${BASE}logo.png`}
              alt="Vireon Projects"
              className="w-9 h-9 object-contain rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300"
            />
            <span className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
              Vireon Projects
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <a
            href="https://github.com/APISje/APISje"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">Repository</span>
          </a>

          <Link href="/admin">
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
              location === "/admin"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}>
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </div>
          </Link>
        </nav>
      </div>
    </header>
  );
}
