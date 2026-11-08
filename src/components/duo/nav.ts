import {
  Home,
  MessagesSquare,
  Sparkles,
  Brain,
  CalendarDays,
  ListChecks,
  FolderKanban,
  FileText,
  Settings,
} from "lucide-react";

export const NAV = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/conversations", label: "Conversations", icon: MessagesSquare },
  { to: "/assistant", label: "Assistant DUO", icon: Sparkles },
  { to: "/memoire", label: "Mémoire", icon: Brain },
  { to: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { to: "/taches", label: "Tâches", icon: ListChecks },
  { to: "/projets", label: "Projets", icon: FolderKanban },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;

export const MOBILE_PRIMARY = ["/", "/conversations", "/assistant", "/taches"] as const;
