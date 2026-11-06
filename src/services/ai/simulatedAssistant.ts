/**
 * SIMULATED assistant. No network call, no AI provider, no data leaves the
 * device. Responses are canned text clearly marked as demonstration.
 * Cancellation via AbortSignal: an aborted request is discarded and never retried.
 */
import type { AssistantMode } from "@/domain/types";

export const AI_CONNECTED = false as const;

export const MODES: Record<AssistantMode, { label: string; hint: string; reply: string }> = {
  support: { label: "Soutien de couple", hint: "Formuler un besoin avec bienveillance", reply: "[Démonstration] Une piste neutre : exprimer ce que vous ressentez en « je », puis proposer un moment calme pour en parler. Aucun diagnostic ni jugement n'est posé." },
  organization: { label: "Organisation", hint: "Planifier, répartir, rappeler", reply: "[Démonstration] Proposition fictive : regrouper les courses le jeudi et bloquer 30 minutes le dimanche pour la semaine à venir." },
  ideas: { label: "Conseils & idées", hint: "Sorties, cadeaux, activités", reply: "[Démonstration] Trois idées fictives : pique-nique au parc, atelier cuisine à deux, soirée jeux de société." },
  analysis: { label: "Analyse & amélioration", hint: "Revoir une routine, un projet", reply: "[Démonstration] Sur le projet choisi : identifier la prochaine étape concrète et la personne volontaire. Aucune analyse réelle n'est effectuée." },
};

export function simulateReply(mode: AssistantMode, signal: AbortSignal, delay = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Annulée", "AbortError"));
    const t = setTimeout(() => resolve(MODES[mode].reply), delay);
    signal.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Annulée", "AbortError")); }, { once: true });
  });
}
