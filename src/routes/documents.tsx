import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/duo/badges";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/documents")({
  head: () => pageHead("Documents", "Documents partagés — stockage sécurisé à venir."),
  component: Docs,
});

function Docs() {
  return (
    <div>
      <PageHeader title="Documents" />
      <EmptyState icon={FileText} title="Aucun document">
        L'envoi de fichiers sera disponible une fois le stockage sécurisé mis en place.
        <div className="mt-4"><Button disabled>Ajouter un document (bientôt)</Button></div>
      </EmptyState>
    </div>
  );
}
