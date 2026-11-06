import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PrivacyBadge, DemoBadge } from "@/components/duo/badges";
import { useDuo } from "@/state/duo-store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/calendrier")({
  head: () => pageHead("Calendrier", "Agenda commun et événements privés (démonstration)."),
  component: Cal,
});

function Cal() {
  const { events } = useDuo();
  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
  const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  return (
    <div>
      <PageHeader title="Calendrier" subtitle="Prochains événements." actions={<DemoBadge />} />
      <ul className="space-y-2">
        {sorted.map((e) => (
          <li key={e.id} className="flex items-center justify-between rounded-2xl border bg-card p-4">
            <div><p className="font-medium">{e.title}</p><p className="text-sm capitalize text-muted-foreground">{fmt.format(new Date(e.start))}</p></div>
            <PrivacyBadge visibility={e.visibility} />
          </li>
        ))}
      </ul>
    </div>
  );
}
