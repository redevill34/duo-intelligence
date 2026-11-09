import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/duo/badges";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";
import { LocalVaultPanel } from "@/components/duo/LocalVaultPanel";

export const Route = createFileRoute("/parametres")({
  head: () =>
    pageHead("Paramètres", "Compte, espace couple, confidentialité, consentements et données."),
  component: Settings,
});

const SECTIONS = [
  ["Compte", "Profil, connexion et sécurité du compte."],
  ["Espace couple", "Deux membres maximum. Invitation et départ de l'espace."],
  ["Confidentialité", "Privé par défaut. Aucune surveillance du partenaire."],
  [
    "Consentements",
    "Toute future requête cloud demandera votre accord à chaque fois, avec le détail des données et du destinataire.",
  ],
  ["Appareils", "Sessions et appareils connectés."],
  ["Export de mes données", "Droit RGPD individuel à la portabilité."],
  [
    "Suppression de mes données",
    "Droit individuel à l'effacement : le partenaire ne peut pas s'y opposer. Confirmation renforcée requise.",
  ],
] as const;

function Settings() {
  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Coffre et sauvegardes sur cet appareil. Les autres fonctions restent à construire."
      />
      <LocalVaultPanel />
      <ul className="space-y-3">
        {SECTIONS.map(([t, d]) => (
          <li
            key={t}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4"
          >
            <div>
              <p className="font-medium">{t}</p>
              <p className="text-sm text-muted-foreground">{d}</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              À construire
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
