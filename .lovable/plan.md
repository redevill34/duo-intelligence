# DUO Intelligence — plan de réalisation par lots

Ce tour n'a entraîné aucune modification de code, aucun build, aucune installation ni connexion de service. Seul ce plan a été écrit.

## 1. État constaté du dépôt (lecture seule)

- Rubriques présentes : Accueil, Conversations, Assistant, Mémoire, Calendrier, Tâches, Projets, Documents, Paramètres.
- Rubriques validées mais absentes : liste de courses, rappels, notifications, garage (automobile), logement/entretien, corbeille, appareils, sauvegardes, dashboard personnalisable.
- Données : fixtures en mémoire (`src/services/demo/`), contrats `src/services/repositories.ts` incomplets (pas d'écriture, pas de courses/garage/logement/documents).
- Règles : `src/domain/rules.ts` (2 membres, double approbation versionnée, arrêt/réactivation à deux) — miroir d'interface uniquement.
- PWA : manifeste + icônes ; aucun service worker (confirmé : aucun `serviceWorker` dans le code). Pas d'offline.
- Tests : 2 fichiers (`duo-rules.test.ts`, `app-routing.test.tsx`), jamais exécutés. Build jamais vérifié.
- Backend : aucun. Pas d'authentification, pas de RLS. `AGENTS.md` ne contient que le bloc Lovable ; `roadmap.md` absent.
- Le prototype n'est ni sécurisé ni publiable.

## 2. Principe d'architecture (compatible 0 €/mois)

```text
UI (routes, composants)
   -> hooks de données (TanStack Query)
      -> contrats Repositories (lecture + écriture, typés zod)
         -> implémentation LOCALE (IndexedDB chiffrée)  [lot 2, gratuit, sans compte]
         -> implémentation SERVEUR (à choisir)         [lot 5, décision requise]
Règles domaine pures -> exécutées côté client ET re-exécutées côté serveur
```

- Local-first : l'appareil est la source primaire, la synchronisation serveur vient ensuite. Cela sert l'offline complet et le 0 €.
- Le serveur (quand il existera) reste l'unique autorité pour permissions, couple à 2, arrêt IA, approbations.
- Aucun fournisseur n'est choisi dans ce plan. Options à évaluer au lot 5 (sans activation) : Lovable Cloud (offre gratuite à vérifier, limites et pérennité non prouvées), autre hébergeur gratuit, ou auto-hébergement. Décision utilisateur obligatoire.

## 3. Lots ordonnés

### Lot 0 — Vérification de l'existant (aucun service externe)
- Lancer build, typecheck, `bunx vitest run` ; corriger les erreurs.
- Créer `roadmap.md` et règles d'architecture dans `AGENTS.md`.
- Acceptation : build OK, tests existants verts, navigation des 9 rubriques vérifiée en navigateur (mobile 390 px + bureau 1280 px).

### Lot 1 — Modèle de données complet et règles domaine (local, sans service) — PREMIER LOT PROPOSÉ
Fichiers : `src/domain/types.ts`, `src/domain/rules.ts`, nouveaux `src/domain/permissions.ts`, `src/domain/schemas.ts` (zod), `src/services/repositories.ts`, `src/test/*`.
- Types manquants : ShoppingItem, Reminder, Notification, Vehicle + MaintenanceEntry (sans OBD/carburant/péages/stationnement), HomeItem + HomeMaintenance, Document (métadonnées), TrashEntry (purge à 180 j), Device (max 3 actifs), Backup, DashboardLayout par utilisateur, partage volontaire des événements.
- `permissions.ts` deny-by-default : une seule fonction `can(actor, action, resource)` qui refuse tout cas non listé ; privé = propriétaire seul ; commun = 2 membres de l'espace ; mémoire partenaire jamais lisible ; IA commune bloquée si suspendue.
- Règles : corbeille 180 j, limite 3 appareils, invitations (refus d'un 3e membre), partage d'événement révocable.
- Contrats repository en lecture/écriture avec validation zod en entrée.
- Tests (un par règle) : refus par défaut, isolation privé/commun sur chaque type, 3e membre refusé, 4e appareil refusé, purge exactement après 180 j, approbation invalidée par nouvelle version, IA suspendue = toute requête commune refusée, réactivation à deux.
- Acceptation : 100 % des tests de permissions verts ; aucune UI modifiée hormis compilation.

### Lot 2 — Persistance locale chiffrée et offline (local, gratuit)
- Implémentation `LocalRepositories` sur IndexedDB, chiffrement WebCrypto (AES-GCM, clé dérivée d'une phrase de passe locale), aucune donnée en clair dans localStorage.
- Service worker via `vite-plugin-pwa` (generateSW), garde stricte : jamais en aperçu/dev, `?sw=off`, navigation NetworkFirst, aucune réponse IA ni donnée privée en cache HTTP (données uniquement dans IndexedDB chiffrée).
- Sauvegarde locale quotidienne (export chiffré téléchargeable) + restauration ; tests de restauration aller-retour.
- Acceptation : app utilisable hors ligne (version publiée), restauration identique à l'original, aucun clair détecté dans le stockage.

### Lot 3 — Nouvelles rubriques et dashboard (local)
- Routes : `courses`, `rappels`, `garage`, `logement`, `corbeille`, `notifications` ; formulaire d'événement calendrier avec partage volontaire ; dashboard à widgets choisis par partenaire.
- Notifications V1 : centre interne in-app aux deux partenaires (push réel = lot 6, décision).
- Acceptation : chaque écran avec états chargement/vide/erreur, pastilles Privé/Commun, clavier et lecteur d'écran OK.

### Lot 4 — Conformité RGPD côté produit (local)
- Export individuel JSON, effacement individuel sans veto du partenaire, registre des consentements, journal d'audit local, pages mentions/confidentialité (textes à valider juridiquement).
- Acceptation : export complet de mes seules données ; effacement ne touche pas les données privées du partenaire.

### Lot 5 — Backend et authentification (DÉCISION BLOQUANTE)
- Prérequis : choix d'un fournisseur avec gratuité vérifiée et validation explicite.
- Contenu : comptes, espaces à 2 (contrainte en base), RLS deny-by-default par table, fonctions serveur validant chaque écriture, arrêt IA commun côté serveur, double approbation côté serveur, sync local↔serveur avec résolution de conflits, limite 3 appareils côté serveur, sauvegarde cloud quotidienne, hébergement UE.
- Tests d'intégration : chaque table testée avec utilisateur A, B, et intrus C.

### Lot 6 — Fonctions externes (décisions séparées)
- Push réel (Web Push), IA réelle (consentement par requête, après lots 1–5), stockage documents chiffré.
- V2 : finances, repas. V3 : banque, publicité/abonnements. Hors périmètre actuel.

## 4. Stratégie de tests
- Unitaires (vitest) : règles et permissions, une règle = un test, valeurs concrètes.
- Intégration : repositories local puis serveur, isolation A/B/C.
- E2E (Playwright) : parcours couple, création conversation commune, approbation mémoire, arrêt d'urgence.
- Sécurité/confidentialité : matrice permissions exhaustive, tentative d'accès direct aux données partenaire, recherche de clair dans le stockage.
- Accessibilité : axe-core sur chaque route, navigation clavier.
- Responsive : 360, 390, 768, 1024, 1280 px.
- PWA/offline et restauration : coupure réseau, sauvegarde puis restauration identique.
- Porte bêta : tous les tests de permissions/confidentialité verts, sinon pas de bêta.

## 5. Local vs externe
- Sans compte ni frais : lots 0 à 4.
- Exige une décision/compte : lot 5 (backend, auth, sauvegarde cloud), lot 6 (push, IA, stockage distant), publication.

## 6. Risques et décisions bloquantes
- Bloquant : choix du backend gratuit durable (lot 5). Aucun n'est prouvé gratuit à vie.
- Risque : chiffrement local + oubli de phrase de passe = perte de données ; prévoir sauvegarde de clé.
- Risque : iOS limite stockage et service worker (purge possible après inactivité).
- Risque : « offline complet » + synchronisation à deux = conflits ; règle proposée : dernier écrit gagne sauf mémoire commune (versionnée).
- Arbitrage : Google Fonts (service externe gratuit) — garder ou héberger les polices localement.
- Crédits Lovable : chaque lot consomme des crédits de construction ; à valider avant lancement.

## Détails techniques du lot 1 (premier lot recommandé)
Pourquoi d'abord : il ne dépend d'aucun service, ne coûte rien en fonctionnement, et fixe le contrat que le backend futur devra respecter. Lot 0 est exécuté au début du même passage (build + tests) pour partir d'une base saine.
