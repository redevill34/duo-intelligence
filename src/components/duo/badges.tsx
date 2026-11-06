import { Lock, Users, FlaskConical } from "lucide-react";
import type { Visibility } from "@/domain/types";
import { cn } from "@/lib/utils";

export function PrivacyBadge({ visibility, className }: { visibility: Visibility; className?: string }) {
  const priv = visibility === "private";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        priv ? "bg-private-soft text-private" : "bg-shared-soft text-shared",
        className,
      )}
      aria-label={priv ? "Privé : visible par vous seul" : "Commun : visible par vous deux"}
    >
      {priv ? <Lock className="h-3 w-3" aria-hidden /> : <Users className="h-3 w-3" aria-hidden />}
      {priv ? "Privé" : "Commun"}
    </span>
  );
}

export function DemoBadge({ label = "Démo", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-demo-soft px-2 py-0.5 text-xs font-medium text-demo", className)}>
      <FlaskConical className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-medium md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}

export function EmptyState({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
      <Icon className="mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
