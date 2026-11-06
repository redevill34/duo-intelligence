import type { Repositories } from "../repositories";
import * as F from "./fixtures";

/** Fresh deep copy so demo state never leaks between sessions/tests. */
const clone = <T,>(v: T): T => structuredClone(v);
const wait = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(clone(v)), ms));

export function createDemoRepositories(): Repositories {
  let conversations = clone(F.conversations);
  return {
    auth: { mode: "prototype", currentUser: () => wait(F.ME), signOut: async () => {} },
    space: { getMySpace: () => wait(F.SPACE), getPartner: () => wait(F.PARTNER), listActivity: () => wait(F.audit) },
    conversations: {
      // Demo filter only — real filtering must be server-side.
      listMine: () => wait(conversations.filter((c) => c.participantIds.includes(F.ME.id))),
      listMessages: (id) => wait(F.messages.filter((m) => m.conversationId === id)),
      createShared: async (title) => {
        const now = new Date().toISOString();
        const c = { id: `c-${Date.now()}`, spaceId: F.SPACE.id, title, visibility: "shared" as const, participantIds: [F.ME.id, F.PARTNER.id], createdBy: F.ME.id, createdAt: now, updatedAt: now };
        conversations = [c, ...conversations];
        return clone(c);
      },
    },
    memory: {
      listMyPrivate: () => wait(F.myMemories),
      listShared: () => wait(F.sharedMemories),
      listProposals: () => wait(F.proposals),
    },
    planning: { listTasks: () => wait(F.tasks), listProjects: () => wait(F.projects), listEvents: () => wait(F.events) },
  };
}
