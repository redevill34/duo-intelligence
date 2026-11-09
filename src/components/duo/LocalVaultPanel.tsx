import { useState } from "react";
import { Download, LockKeyhole, Upload, Unlock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useDuo } from "@/state/duo-store";
import type { LocalSnapshot } from "@/domain/schemas";

export function LocalVaultPanel() {
  const { local } = useDuo();
  const [passphrase, setPassphrase] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState<LocalSnapshot | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const run = async (action: () => Promise<void>) => {
    setWorking(true); setError("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Opération impossible."); }
    finally { setWorking(false); setPassphrase(""); }
  };
  const disabled = working || local.busy;
  return <section className="mb-6 space-y-4 border-b pb-6" aria-label="Coffre local">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><LockKeyhole className="h-5 w-5" /> Coffre local</h2>
      <p role="status" className="text-sm text-muted-foreground">{local.active ? local.saved ? "Enregistré sur cet appareil" : "Enregistrement…" : "Démonstration · coffre fermé"}</p>
    </div>
    <p className="text-sm text-muted-foreground">Phrase de passe oubliée : aucune récupération possible. Conservez-la séparément du fichier de sauvegarde. Le chiffrement ne protège pas un appareil compromis, ni les données affichées lorsque le coffre est ouvert.</p>
    <div className="max-w-md space-y-2">
      <Label htmlFor="vault-pass">{local.active ? "Phrase de passe du fichier à importer" : "Phrase de passe locale (12 caractères minimum)"}</Label>
      <Input id="vault-pass" type="password" autoComplete="off" value={passphrase} onChange={e => setPassphrase(e.target.value)} disabled={disabled} />
    </div>
    {!local.active ? <>
      <div className="flex items-start gap-2"><Checkbox id="vault-confirm" checked={confirmed} onCheckedChange={v => setConfirmed(v === true)} /><Label htmlFor="vault-confirm" className="text-sm leading-relaxed">Je comprends le risque de perte et autorise la copie de la démonstration actuelle, y compris mes modifications, dans ce coffre.</Label></div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={disabled || !confirmed || passphrase.length < 12} onClick={() => void run(() => local.activate(passphrase, true))}><LockKeyhole /> Créer le coffre</Button>
        <Button variant="outline" disabled={disabled || passphrase.length < 12} onClick={() => void run(() => local.activate(passphrase, false))}><Unlock /> Déverrouiller</Button>
      </div>
    </> : <>
      <div className="flex flex-wrap gap-2">
        <Button disabled={disabled} onClick={() => void run(local.exportFile)}><Download /> Exporter chiffré</Button>
        <Button variant="outline" disabled={disabled} onClick={() => void run(async () => { setPending(await local.prepareDaily()); })}><RotateCcw /> Point quotidien</Button>
        <Button variant="outline" disabled={disabled} onClick={() => void run(async () => { setPending(null); await local.lock(); })}><LockKeyhole /> Verrouiller</Button>
      </div>
      <div className="space-y-2"><Label htmlFor="vault-file" className="flex items-center gap-2"><Upload className="h-4 w-4" /> Importer une sauvegarde .duo</Label>
        <Input id="vault-file" type="file" accept=".duo,application/json" disabled={disabled || passphrase.length < 12} onChange={e => {
          const file = e.target.files?.[0]; e.target.value = ""; setPending(null);
          if (!file) return;
          void run(async () => { if (file.size > 28000000) throw new Error("Fichier trop volumineux."); setPending(await local.prepareImport(await file.text(), passphrase)); });
        }} />
      </div>
      <p className="text-sm text-muted-foreground">Point quotidien sur cet appareil : {local.dailyAt ? new Date(local.dailyAt).toLocaleString("fr") : "Aucun"}. Dernier téléchargement demandé : {local.exportedAt ? new Date(local.exportedAt).toLocaleString("fr") : "Aucun"}.</p>
      <p className="text-sm text-muted-foreground">Le point quotidien est créé à l’ouverture ou au retour dans DUO, coffre ouvert. Il ne remplace pas un fichier téléchargé : le navigateur peut effacer son stockage. Un téléchargement quotidien automatique n’est pas garanti.</p>
    </>}
    {pending && <div role="alertdialog" aria-label="Confirmer la restauration" className="space-y-3 border-l-2 border-destructive pl-4">
      <p className="text-sm">Fichier validé : {pending.tasks.length} tâches, {pending.events.length} événements, {pending.conversations.length} conversations et {pending.proposals.length} propositions. Restaurer remplacera les données actuelles. Exportez-les d’abord si nécessaire.</p>
      <div className="flex flex-wrap gap-2"><Button variant="destructive" disabled={disabled} onClick={() => void run(async () => { await local.restore(pending); setPending(null); })}>Confirmer le remplacement</Button><Button variant="outline" disabled={disabled} onClick={() => setPending(null)}>Annuler</Button></div>
    </div>}
    {(error || local.error) && <p role="alert" className="text-sm text-destructive">{error || local.error}</p>}
  </section>;
}