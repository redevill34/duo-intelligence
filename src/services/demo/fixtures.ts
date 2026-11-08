/**
 * FICTIONAL demonstration data. No real person, no real content.
 * Kept in memory only — never persisted to localStorage.
 * The partner's private data is intentionally ABSENT from the fixtures.
 */
import type {
  CalendarEvent,
  Conversation,
  CoupleSpace,
  Message,
  Memory,
  MemoryProposal,
  Project,
  Task,
  User,
  AuditEvent,
} from "@/domain/types";

const d = (offsetDays: number, h = 9, m = 0) => {
  const x = new Date();
  x.setDate(x.getDate() + offsetDays);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
};

export const ME: User = {
  id: "u-demo-a",
  displayName: "Camille (démo)",
  email: "camille@exemple.test",
  avatarInitials: "CA",
  createdAt: d(-60),
};
export const PARTNER: User = {
  id: "u-demo-b",
  displayName: "Sacha (démo)",
  email: "sacha@exemple.test",
  avatarInitials: "SA",
  createdAt: d(-60),
};

export const SPACE: CoupleSpace = {
  id: "s-demo",
  name: "Notre espace (démo)",
  createdAt: d(-58),
  memberIds: [ME.id, PARTNER.id],
  sharedAiStatus: { suspended: false, reactivationApprovals: [] },
};

export const conversations: Conversation[] = [
  {
    id: "c1",
    spaceId: SPACE.id,
    title: "Mes notes de la semaine",
    visibility: "private",
    participantIds: [ME.id],
    createdBy: ME.id,
    createdAt: d(-3),
    updatedAt: d(-1),
  },
  {
    id: "c2",
    spaceId: SPACE.id,
    title: "Idées cadeaux (privé)",
    visibility: "private",
    participantIds: [ME.id],
    createdBy: ME.id,
    createdAt: d(-10),
    updatedAt: d(-4),
  },
  {
    id: "c3",
    spaceId: SPACE.id,
    title: "Organisation du week-end",
    visibility: "shared",
    participantIds: [ME.id, PARTNER.id],
    createdBy: PARTNER.id,
    createdAt: d(-2),
    updatedAt: d(0, 8),
  },
];

export const messages: Message[] = [
  {
    id: "m1",
    conversationId: "c1",
    authorId: ME.id,
    body: "Penser à appeler le plombier lundi.",
    createdAt: d(-1, 18),
  },
  {
    id: "m2",
    conversationId: "c2",
    authorId: ME.id,
    body: "Un atelier de céramique ?",
    createdAt: d(-4, 20),
  },
  {
    id: "m3",
    conversationId: "c3",
    authorId: PARTNER.id,
    body: "On part samedi matin ou vendredi soir ?",
    createdAt: d(-1, 19),
  },
  {
    id: "m4",
    conversationId: "c3",
    authorId: ME.id,
    body: "Samedi matin, plus reposant.",
    createdAt: d(0, 8),
  },
];

export const myMemories: Memory[] = [
  {
    id: "mem1",
    spaceId: SPACE.id,
    ownerId: ME.id,
    visibility: "private",
    content: "Je préfère les réunions le matin.",
    version: 1,
    createdAt: d(-20),
  },
  {
    id: "mem2",
    spaceId: SPACE.id,
    ownerId: ME.id,
    visibility: "private",
    content: "Objectif personnel : courir 2 fois par semaine.",
    version: 1,
    createdAt: d(-12),
  },
];

export const sharedMemories: Memory[] = [
  {
    id: "mem3",
    spaceId: SPACE.id,
    ownerId: null,
    visibility: "shared",
    content: "Dîner chez les parents le premier dimanche du mois.",
    version: 2,
    createdAt: d(-30),
  },
];

export const proposals: MemoryProposal[] = [
  {
    id: "p1",
    spaceId: SPACE.id,
    proposedBy: PARTNER.id,
    content: "Courses groupées le jeudi soir.",
    version: 1,
    approvals: [],
    createdAt: d(-1),
  },
  {
    id: "p2",
    spaceId: SPACE.id,
    proposedBy: ME.id,
    content: "Budget vacances plafonné et revu chaque trimestre.",
    version: 1,
    approvals: [{ userId: ME.id, version: 1, decision: "approved", decidedAt: d(-1) }],
    createdAt: d(-2),
  },
  {
    id: "p3",
    spaceId: SPACE.id,
    proposedBy: PARTNER.id,
    content: "Soirée sans écran le mercredi.",
    version: 2,
    approvals: [
      { userId: PARTNER.id, version: 2, decision: "approved", decidedAt: d(-1) },
      { userId: ME.id, version: 1, decision: "approved", decidedAt: d(-3) },
    ],
    createdAt: d(-5),
  },
  {
    id: "p4",
    spaceId: SPACE.id,
    proposedBy: ME.id,
    content: "Arrosage des plantes : alternance hebdomadaire.",
    version: 1,
    approvals: [
      { userId: ME.id, version: 1, decision: "approved", decidedAt: d(-6) },
      { userId: PARTNER.id, version: 1, decision: "approved", decidedAt: d(-5) },
    ],
    createdAt: d(-7),
  },
  {
    id: "p5",
    spaceId: SPACE.id,
    proposedBy: PARTNER.id,
    content: "Partager automatiquement nos agendas complets.",
    version: 1,
    approvals: [{ userId: ME.id, version: 1, decision: "refused", decidedAt: d(-8) }],
    createdAt: d(-9),
  },
];

export const tasks: Task[] = [
  {
    id: "t1",
    spaceId: SPACE.id,
    title: "Réserver le gîte",
    assigneeId: ME.id,
    visibility: "shared",
    status: "doing",
    dueDate: d(2),
    projectId: "pr1",
  },
  {
    id: "t2",
    spaceId: SPACE.id,
    title: "Acheter des ampoules",
    assigneeId: PARTNER.id,
    visibility: "shared",
    status: "todo",
    dueDate: d(1),
  },
  {
    id: "t3",
    spaceId: SPACE.id,
    title: "Renouveler mon passeport",
    assigneeId: ME.id,
    visibility: "private",
    status: "todo",
    dueDate: d(14),
  },
  {
    id: "t4",
    spaceId: SPACE.id,
    title: "Choisir la peinture du salon",
    assigneeId: null,
    visibility: "shared",
    status: "done",
    projectId: "pr2",
  },
];

export const projects: Project[] = [
  {
    id: "pr1",
    spaceId: SPACE.id,
    name: "Week-end en Bretagne",
    description: "Trajet, logement, activités.",
    visibility: "shared",
    progress: 45,
    color: "chart-1",
  },
  {
    id: "pr2",
    spaceId: SPACE.id,
    name: "Rafraîchir le salon",
    description: "Peinture, lumière, rangement.",
    visibility: "shared",
    progress: 70,
    color: "chart-2",
  },
  {
    id: "pr3",
    spaceId: SPACE.id,
    name: "Préparer un semi-marathon",
    description: "Projet personnel.",
    visibility: "private",
    progress: 20,
    color: "chart-3",
  },
];

export const events: CalendarEvent[] = [
  {
    id: "e1",
    spaceId: SPACE.id,
    title: "Dîner chez les parents",
    start: d(3, 19),
    end: d(3, 22),
    visibility: "shared",
    ownerId: ME.id,
  },
  {
    id: "e2",
    spaceId: SPACE.id,
    title: "Départ week-end",
    start: d(5, 8),
    end: d(5, 10),
    visibility: "shared",
    ownerId: PARTNER.id,
  },
  {
    id: "e3",
    spaceId: SPACE.id,
    title: "Rendez-vous dentiste",
    start: d(1, 14),
    end: d(1, 15),
    visibility: "private",
    ownerId: ME.id,
  },
  {
    id: "e4",
    spaceId: SPACE.id,
    title: "Cinéma",
    start: d(0, 20, 30),
    end: d(0, 23),
    visibility: "shared",
    ownerId: ME.id,
  },
];

export const audit: AuditEvent[] = [
  {
    id: "a1",
    spaceId: SPACE.id,
    actorId: PARTNER.id,
    action: "conversation.shared_created",
    createdAt: d(-2),
    summary: "Conversation commune « Organisation du week-end » créée",
  },
  {
    id: "a2",
    spaceId: SPACE.id,
    actorId: ME.id,
    action: "memory_proposal.decided",
    createdAt: d(-1),
    summary: "Proposition de mémoire commune approuvée (v1)",
  },
  {
    id: "a3",
    spaceId: SPACE.id,
    actorId: PARTNER.id,
    action: "task.updated",
    createdAt: d(0, 8),
    summary: "Tâche « Acheter des ampoules » ajoutée",
  },
];
