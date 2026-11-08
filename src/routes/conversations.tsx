import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PrivacyBadge } from "@/components/duo/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDuo } from "@/state/duo-store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/conversations")({
  head: () =>
    pageHead(
      "Conversations",
      "Conversations privées par défaut, communes sur décision volontaire.",
    ),
  component: Conversations,
});

function Conversations() {
  const { conversations, addSharedConversation } = useDuo();
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);
  const priv = conversations.filter((c) => c.visibility === "private");
  const shared = conversations.filter((c) => c.visibility === "shared");
  return (
    <div>
      <PageHeader
        title="Conversations"
        subtitle="Privées par défaut. Une conversation commune se crée volontairement."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Conversation commune
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une conversation commune</DialogTitle>
                <DialogDescription>
                  Elle sera visible par vous deux. Vos conversations privées ne sont pas concernées.
                </DialogDescription>
              </DialogHeader>
              <Input
                aria-label="Titre"
                placeholder="Titre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <DialogFooter>
                <Button
                  disabled={!title.trim()}
                  onClick={() => {
                    addSharedConversation(title.trim());
                    setTitle("");
                    setOpen(false);
                    toast.success("Conversation commune créée (démo)");
                  }}
                >
                  Créer et partager
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-6 md:grid-cols-2">
        {[
          { label: "Privées", list: priv },
          { label: "Communes", list: shared },
        ].map((g) => (
          <section key={g.label} aria-label={g.label} className="rounded-2xl border bg-card p-4">
            <h2 className="mb-3 font-medium">{g.label}</h2>
            <ul className="space-y-2">
              {g.list.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm"
                >
                  {c.title}
                  <PrivacyBadge visibility={c.visibility} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
