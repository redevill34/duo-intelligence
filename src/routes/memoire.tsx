import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";
import { PageHeader, PrivacyBadge, DemoBadge } from "@/components/duo/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { proposalStatus } from "@/domain/rules";
import type { ProposalStatus } from "@/domain/types";
import { myMemories, sharedMemories } from "@/services/demo/fixtures";
import { useDuo } from "@/state/duo-store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/memoire")({
  head: () =>
    pageHead("Mémoire", "Mémoire personnelle privée et mémoire commune approuvée à deux."),
  component: MemoryPage,
});

const LABEL: Record<ProposalStatus, string> = {
  pending: "En attente",
  approved_by_me: "Approuvée par moi · attente de l'autre",
  awaiting_other: "Approuvée par l'autre · votre accord attendu",
  confirmed: "Confirmée",
  refused: "Refusée",
};

function MemoryPage() {
  const { me, partner, proposals, decide, propose } = useDuo();
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mémoire"
        subtitle="Rien de sensible n'est mémorisé automatiquement."
        actions={<DemoBadge />}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="mb-2 flex justify-between font-medium">
            Ma mémoire <PrivacyBadge visibility="private" />
          </h2>
          <ul className="space-y-2 text-sm">
            {myMemories.map((m) => (
              <li key={m.id}>{m.content}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border bg-muted p-4" aria-label="Mémoire du partenaire">
          <h2 className="mb-2 font-medium">Mémoire de {partner.displayName}</h2>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Non accessible. Son contenu reste strictement privé.
          </p>
        </section>
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="mb-2 flex justify-between font-medium">
            Mémoire commune <PrivacyBadge visibility="shared" />
          </h2>
          <ul className="space-y-2 text-sm">
            {sharedMemories.map((m) => (
              <li key={m.id}>
                {m.content} <span className="text-muted-foreground">(v{m.version})</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="font-medium">Propositions de mémoire commune</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Active uniquement après approbation des deux partenaires sur la même version.
        </p>
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) {
              propose(draft.trim());
              setDraft("");
            }
          }}
        >
          <Input
            aria-label="Nouvelle proposition"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Proposer une mémoire commune…"
          />
          <Button type="submit">Proposer</Button>
        </form>
        <ul className="space-y-2">
          {proposals.map((p) => {
            const st = proposalStatus(p, me.id, partner.id);
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm"
              >
                <span>
                  {p.content} <span className="text-muted-foreground">· v{p.version}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className="rounded-full bg-card px-2 py-0.5 text-xs"
                    data-testid={`status-${p.id}`}
                  >
                    {LABEL[st]}
                  </span>
                  {(st === "pending" || st === "awaiting_other") && (
                    <>
                      <Button size="sm" onClick={() => decide(p.id, "approved")}>
                        Approuver v{p.version}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => decide(p.id, "refused")}>
                        Refuser
                      </Button>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
