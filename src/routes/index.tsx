import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessagesSquare, Brain, ListChecks, CalendarDays } from "lucide-react";
import { PageHeader, DemoBadge } from "@/components/duo/badges";
import { ReactivationPanel } from "@/components/duo/EmergencyStop";
import { useDuo } from "@/state/duo-store";
import { createDemoRepositories } from "@/services/demo/demoRepositories";
import { pageHead } from "@/lib/seo";

const repos = createDemoRepositories();

export const Route = createFileRoute("/")({
  head: () => pageHead("Accueil", "Tableau de bord de votre espace DUO à deux."),
  component: Home,
});

function Home() {
  const { me, partner, sharedAi, tasks } = useDuo();
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => repos.space.listActivity() });
  const shortcuts = [
    { to: "/conversations", label: "Conversations", icon: MessagesSquare },
    { to: "/memoire", label: "Mémoire", icon: Brain },
    { to: "/taches", label: "Tâches", icon: ListChecks },
    { to: "/calendrier", label: "Calendrier", icon: CalendarDays },
  ] as const;
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bonjour, ${me.displayName.split(" ")[0]}`}
        subtitle="Votre espace partagé, à votre rythme."
      />
      <ReactivationPanel />
      <section className="rounded-2xl bg-hero p-6 text-primary-foreground shadow-soft">
        <p className="text-sm opacity-80">État de l'espace</p>
        <p className="font-display mt-1 text-2xl">
          2 / 2 membres · {me.displayName} & {partner.displayName}
        </p>
        <p className="mt-2 text-sm opacity-90">
          IA commune : {sharedAi.suspended ? "suspendue" : "non connectée (démonstration)"} ·{" "}
          {tasks.filter((t) => t.status !== "done").length} tâches ouvertes
        </p>
      </section>
      <section aria-label="Raccourcis" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {shortcuts.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="rounded-2xl border bg-card p-4 shadow-soft transition hover:bg-secondary"
          >
            <s.icon className="h-5 w-5 text-ring" aria-hidden />
            <p className="mt-2 font-medium">{s.label}</p>
          </Link>
        ))}
      </section>
      <section className="rounded-2xl border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Activité commune</h2>
          <DemoBadge />
        </div>
        {activity.isLoading && (
          <p className="text-sm text-muted-foreground" role="status">
            Chargement…
          </p>
        )}
        {activity.isError && (
          <p className="text-sm text-destructive">Impossible de charger l'activité.</p>
        )}
        <ul className="space-y-2 text-sm">
          {activity.data?.map((a) => (
            <li key={a.id} className="text-muted-foreground">
              {a.summary}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
