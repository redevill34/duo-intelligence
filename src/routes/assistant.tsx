import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, DemoBadge } from "@/components/duo/badges";
import { ReactivationPanel } from "@/components/duo/EmergencyStop";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MODES, simulateReply } from "@/services/ai/simulatedAssistant";
import type { AssistantMode, AssistantScope } from "@/domain/types";
import { useDuo } from "@/state/duo-store";
import { cn } from "@/lib/utils";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/assistant")({
  head: () =>
    pageHead("Assistant DUO", "Assistant DUO en mode démonstration, non connecté à une IA."),
  component: Assistant,
});

function Assistant() {
  const { sharedAi, registerSharedRequest } = useDuo();
  const [mode, setMode] = useState<AssistantMode>("organization");
  const [scope, setScope] = useState<AssistantScope>("personal");
  const [text, setText] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sharedBlocked = scope === "shared" && sharedAi.suspended;

  async function send() {
    const c = new AbortController();
    const unregister = scope === "shared" ? registerSharedRequest(c) : () => {};
    setBusy(true);
    setReply(null);
    try {
      setReply(await simulateReply(mode, c.signal));
    } catch {
      setReply("Requête annulée. Elle ne sera pas relancée.");
    } finally {
      unregister();
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assistant DUO"
        actions={<DemoBadge label="IA non connectée — démonstration" />}
        subtitle="Réponses simulées localement. Aucune donnée n'est envoyée à un fournisseur."
      />
      <ReactivationPanel />
      <div role="radiogroup" aria-label="Portée" className="flex gap-2">
        {(["personal", "shared"] as const).map((s) => (
          <Button
            key={s}
            role="radio"
            aria-checked={scope === s}
            variant={scope === s ? "default" : "outline"}
            size="sm"
            onClick={() => setScope(s)}
          >
            {s === "personal" ? "Assistant personnel" : "IA commune"}
          </Button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(MODES) as AssistantMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={cn(
              "rounded-2xl border p-4 text-left transition",
              mode === m ? "border-ring bg-accent" : "bg-card hover:bg-secondary",
            )}
          >
            <p className="font-medium">{MODES[m].label}</p>
            <p className="text-sm text-muted-foreground">{MODES[m].hint}</p>
          </button>
        ))}
      </div>
      {sharedBlocked ? (
        <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          L'IA commune est suspendue. L'assistant personnel reste disponible, sans accès aux données
          communes.
        </p>
      ) : (
        <div className="space-y-3 rounded-2xl border bg-card p-4">
          <Textarea
            aria-label="Votre message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrivez votre demande (non envoyée, simulation)…"
          />
          <Button onClick={send} disabled={busy || !text.trim()}>
            {busy ? "Simulation…" : "Simuler une réponse"}
          </Button>
          {reply && (
            <p className="rounded-lg bg-demo-soft p-3 text-sm" aria-live="polite">
              {reply}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
