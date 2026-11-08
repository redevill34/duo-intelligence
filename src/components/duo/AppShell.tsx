import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAV, MOBILE_PRIMARY } from "./nav";
import { EmergencyStopButton } from "./EmergencyStop";
import { DemoBadge } from "./badges";
import { useDuo } from "@/state/duo-store";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="DUO — accueil">
      <span aria-hidden className="relative block h-7 w-10">
        <span className="absolute left-0 top-0 h-7 w-7 rounded-full border-2 border-primary" />
        <span className="absolute left-3 top-0 h-7 w-7 rounded-full border-2 border-ring" />
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">DUO</span>
    </Link>
  );
}

function useIsActive() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useIsActive();
  return (
    <ul className="space-y-0.5">
      {NAV.map((item) => {
        const active = isActive(item.to);
        return (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const isActive = useIsActive();
  const { me } = useDuo();
  return (
    <div className="flex min-h-screen w-full">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2"
      >
        Aller au contenu
      </a>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar p-4 lg:flex">
        <div className="mb-6 px-2">
          <Logo />
        </div>
        <nav aria-label="Navigation principale" className="flex-1">
          <NavList />
        </nav>
        <div className="mt-4 rounded-xl border bg-card p-3 text-xs text-muted-foreground">
          <DemoBadge label="Prototype local" />
          <p className="mt-2">Données fictives, non enregistrées. Aucune IA ni serveur connecté.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Navigation mobile" className="px-2">
                <NavList onNavigate={() => setOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>
          <div className="lg:hidden">
            <Logo />
          </div>
          <DemoBadge label="Mode démonstration" className="hidden sm:inline-flex" />
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:block">
              <EmergencyStopButton />
            </div>
            <div className="md:hidden">
              <EmergencyStopButton compact />
            </div>
            <span
              aria-label={`Connecté en démo : ${me.displayName}`}
              className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
            >
              {me.avatarInitials}
            </span>
          </div>
        </header>

        <main
          id="contenu"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:px-8 lg:pb-12"
        >
          {children}
        </main>

        <nav
          aria-label="Navigation rapide"
          className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur lg:hidden"
        >
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {NAV.filter((n) => (MOBILE_PRIMARY as readonly string[]).includes(n.to)).map((item) => {
              const active = isActive(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" aria-hidden />
                    {item.label.replace(" DUO", "")}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                onClick={() => setOpen(true)}
                className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
              >
                <Menu className="h-5 w-5" aria-hidden /> Plus
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
