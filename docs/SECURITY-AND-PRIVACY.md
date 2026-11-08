# Sécurité et confidentialité — état V1

Le prototype V1 **n'offre aucune sécurité réelle**. Toutes les règles (filtrage privé/commun, arrêt d'urgence, approbations) sont des miroirs d'interface, contournables côté client.

Indispensable avant toute donnée réelle :
- Politiques RLS par table et vérifications serveur de chaque autorisation (le modèle IA ne décide jamais).
- Arrêt d'urgence côté serveur : annulation des requêtes, aucune reprise automatique, réactivation à double accord.
- Consentement explicite par requête cloud (données envoyées + destinataire affichés).
- Chiffrement local, gestion des clés, synchronisation hors ligne sûre.
- Journal d'audit, export et effacement RGPD individuels (sans veto du partenaire).
- Audits et tests d'intrusion indépendants.

PWA : manifeste uniquement, **aucun service worker**, donc aucune donnée privée ou réponse IA mise en cache. Aucune donnée démo dans localStorage.

## Lot 1 (réalisé)
Règles d'accès centralisées et testées (32 tests verts) : privé = propriétaire seul, commun = 2 membres, tiers refusé, espace à 3 refusé, mémoire privée non partageable, IA commune bloquée dès suspension, 4e appareil refusé, corbeille purgée à 180 j. **Toujours contournable côté client** tant que le backend n'existe pas.
