import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, PrivacyBadge, DemoBadge } from "@/components/duo/badges";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDuo } from "@/state/duo-store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/taches")({
  head: () => pageHead("Tâches", "Tâches communes et personnelles du quotidien."),
  component: Tasks,
});

function Tasks() {
  const { tasks, setTasks, me } = useDuo();
  const [title, setTitle] = useState("");
  return (
    <div>
      <PageHeader title="Tâches" actions={<DemoBadge />} />
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return;
        setTasks((t) => [{ id: `t-${Date.now()}`, spaceId: "s-demo", title: title.trim(), assigneeId: me.id, visibility: "shared", status: "todo" }, ...t]); setTitle(""); }}>
        <Input aria-label="Nouvelle tâche" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nouvelle tâche commune…" />
        <Button type="submit">Ajouter</Button>
      </form>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
            <Checkbox id={t.id} checked={t.status === "done"} onCheckedChange={(v) => setTasks((ts) => ts.map((x) => x.id === t.id ? { ...x, status: v ? "done" : "todo" } : x))} />
            <label htmlFor={t.id} className={t.status === "done" ? "flex-1 text-muted-foreground line-through" : "flex-1"}>{t.title}</label>
            <PrivacyBadge visibility={t.visibility} />
          </li>
        ))}
      </ul>
    </div>
  );
}
