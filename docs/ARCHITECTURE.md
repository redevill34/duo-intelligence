# Architecture

- `src/domain/` — types et règles métier pures (testées).
- `src/services/repositories.ts` — contrats (auth, espace, conversations, mémoire, planification).
- `src/services/demo/` — implémentation en mémoire + données fictives.
- `src/services/ai/` — assistant simulé (aucun réseau).
- `src/state/duo-store.tsx` — état prototype en mémoire.
- `src/components/duo/` — shell, navigation, arrêt d'urgence, badges.
- `src/routes/` — un écran par rubrique.
