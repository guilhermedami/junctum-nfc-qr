import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Search,
  KanbanSquare,
  CalendarClock,
  MessageSquareText,
  Target,
  Building2,
  Nfc,
  LogOut,
  Menu,
  Plus,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useProfile, useRole, signOutCompletely } from "@/lib/auth";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/prospeccao", label: "Prospecção", icon: Search },
  { to: "/crm", label: "CRM", icon: KanbanSquare },
  { to: "/followups", label: "Follow-ups", icon: CalendarClock },
  { to: "/mensagens", label: "Mensagens", icon: MessageSquareText },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/clientes", label: "Clientes", icon: Building2 },
  { to: "/placas", label: "Placas", icon: Nfc },
] as const;

const MOBILE_NAV = [
  { to: "/dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/crm", label: "CRM", icon: KanbanSquare },
  { to: "/followups", label: "Tarefas", icon: CalendarClock },
  { to: "/placas", label: "Placas", icon: Nfc },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <item.icon className={cn("size-4", active && "text-electric")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: profile } = useProfile();
  const { data: role } = useRole();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOutCompletely(queryClient);
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col justify-between bg-sidebar p-4 lg:flex">
        <div>
          <Link to="/dashboard" className="block px-3 py-2">
            <span className="text-display text-lg font-bold tracking-tight text-sidebar-foreground">
              JUNCTUM
            </span>
          </Link>
          <div className="mt-6">
            <NavLinks />
          </div>
        </div>
        <div className="space-y-3 px-3 pb-2">
          <div className="text-xs text-sidebar-foreground/60">
            <p className="truncate font-medium text-sidebar-foreground">
              {profile?.nome ?? profile?.email ?? "—"}
            </p>
            <p className="uppercase tracking-wide">{role ?? "sem perfil"}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
          >
            <LogOut className="size-3.5" /> Sair
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-4">
              <span className="text-display text-lg font-bold text-sidebar-foreground">
                JUNCTUM
              </span>
              <div className="mt-6">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <button
                onClick={handleSignOut}
                className="mt-8 flex items-center gap-2 text-xs text-sidebar-foreground/60"
              >
                <LogOut className="size-3.5" /> Sair
              </button>
            </SheetContent>
          </Sheet>
          <span className="text-display text-base font-bold">JUNCTUM</span>
          <Button asChild size="icon" variant="ghost">
            <Link to="/prospeccao">
              <Plus className="size-5" />
            </Link>
          </Button>
        </header>

        <main className="px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        {MOBILE_NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground [&.active]:text-electric"
            activeProps={{ className: "active" }}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
