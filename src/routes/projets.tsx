import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PrivacyBadge, DemoBadge } from "@/components/duo/badges";
import { Progress } from "@/components/ui/progress";
import { projects } from "@/services/demo/fixtures";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/projets")({
  head: () => pageHead("Projets", "Projets de couple et projets personnels."),
  component: Projects,
});

function Projects() {
  return (
    <div>
      <PageHeader title="Projets" actions={<DemoBadge />} />
      <div className="grid gap-4 md:grid-cols-3">
        {projects.map((p) => (
          <article key={p.id} className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex justify-between">
              <h2 className="font-medium">{p.name}</h2>
              <PrivacyBadge visibility={p.visibility} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
            <Progress
              value={p.progress}
              className="mt-4"
              aria-label={`Avancement ${p.progress}%`}
            />
            <p className="mt-1 text-xs text-muted-foreground">{p.progress} %</p>
          </article>
        ))}
      </div>
    </div>
  );
}
