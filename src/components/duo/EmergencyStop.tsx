import { useState } from "react";
import { OctagonPause, PlayCircle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDuo } from "@/state/duo-store";

export function EmergencyStopButton({ compact = false }: { compact?: boolean }) {
  const { sharedAi, suspendShared } = useDuo();
  if (sharedAi.suspended) return <SuspendedPill />;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
          <OctagonPause className="h-4 w-4" aria-hidden />
          {compact ? <span className="sr-only">Suspendre l'IA commune</span> : "Suspendre l'IA commune"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Suspendre l'IA commune ?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>L'IA commune sera arrêtée immédiatement. Toute requête en cours est annulée et ne reprendra jamais automatiquement.</p>
              <p>La réactivation nécessitera l'accord de vous deux. Vos assistants personnels restent disponibles, sans accès aux données communes.</p>
              <p className="rounded-md bg-demo-soft p-2 text-demo">Prototype : cet arrêt est un état local de démonstration, pas encore une protection côté serveur.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={suspendShared} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Suspendre maintenant
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SuspendedPill() {
  return (
    <span role="status" className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
      <OctagonPause className="h-3.5 w-3.5" aria-hidden /> IA commune suspendue
    </span>
  );
}

export function ReactivationPanel() {
  const { sharedAi, me, partner, approveReactivationAsMe, simulatePartnerReactivation } = useDuo();
  const [open, setOpen] = useState(false);
  if (!sharedAi.suspended) return null;
  const meOk = sharedAi.reactivationApprovals.includes(me.id);
  const partnerOk = sharedAi.reactivationApprovals.includes(partner.id);
  return (
    <section aria-labelledby="reac-title" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
      <h2 id="reac-title" className="flex items-center gap-2 font-medium text-destructive">
        <OctagonPause className="h-4 w-4" aria-hidden /> IA commune suspendue
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">La réactivation exige l'accord des deux partenaires. (Démonstration locale uniquement.)</p>
      <ul className="mt-3 space-y-1 text-sm">
        <li>Vous : {meOk ? "accord donné" : "en attente"}</li>
        <li>{partner.displayName} : {partnerOk ? "accord donné" : "en attente"}</li>
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        {!meOk && (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button size="sm"><PlayCircle className="h-4 w-4" /> Donner mon accord</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Accord pour réactiver l'IA commune</AlertDialogTitle>
                <AlertDialogDescription>Les requêtes annulées ne seront pas relancées. L'IA commune ne redémarre qu'une fois les deux accords réunis.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={approveReactivationAsMe}>Confirmer mon accord</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {!partnerOk && (
          <Button size="sm" variant="ghost" onClick={simulatePartnerReactivation}>Simuler l'accord du partenaire (démo)</Button>
        )}
      </div>
    </section>
  );
}
