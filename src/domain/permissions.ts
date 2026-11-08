/**
 * Contrôle d'accès centralisé, deny-by-default.
 * PREMIÈRE BARRIÈRE CÔTÉ CLIENT SEULEMENT : contournable. Le futur backend
 * devra réappliquer chaque règle (RLS + vérifications serveur).
 */
import type { CoupleSpace, Device, ID, SharedAiStatus, Visibility } from "./types";
import { MAX_MEMBERS_PER_SPACE } from "./rules";

export const MAX_ACTIVE_DEVICES = 3;
export const TRASH_RETENTION_DAYS = 180;

export type Action = "read" | "write" | "delete" | "share" | "use_shared_ai" | "approve";

export interface Resource {
  kind: string;
  spaceId: ID;
  visibility: Visibility;
  /** Propriétaire pour les ressources privées. */
  ownerId?: ID | null;
  /** Marque une mémoire privée : jamais lisible par un autre que son propriétaire. */
  privateMemory?: boolean;
}

export interface Actor {
  userId: ID;
}

export interface AccessContext {
  space: Pick<CoupleSpace, "id" | "memberIds">;
  sharedAi: SharedAiStatus;
}

const ALLOWED_PRIVATE: readonly Action[] = ["read", "write", "delete", "share"];
const ALLOWED_SHARED: readonly Action[] = ["read", "write", "delete", "approve"];

export function isMember(space: AccessContext["space"], userId: ID): boolean {
  return space.memberIds.length <= MAX_MEMBERS_PER_SPACE && space.memberIds.includes(userId);
}

/** Retourne true uniquement pour les cas explicitement listés. */
export function can(
  actor: Actor | null | undefined,
  action: Action,
  res: Resource | null | undefined,
  ctx: AccessContext,
): boolean {
  if (!actor?.userId || !res || !ctx?.space) return false;
  if (res.spaceId !== ctx.space.id) return false;
  if (!isMember(ctx.space, actor.userId)) return false;

  if (action === "use_shared_ai") {
    return res.visibility === "shared" && !ctx.sharedAi.suspended;
  }

  if (res.visibility === "private") {
    if (!res.ownerId || res.ownerId !== actor.userId) return false;
    if (res.privateMemory && action === "share") return false;
    return ALLOWED_PRIVATE.includes(action);
  }

  if (res.visibility === "shared") {
    return ALLOWED_SHARED.includes(action);
  }

  return false;
}

/** Toute action commune liée à l'IA est bloquée tant que l'IA commune est suspendue. */
export function canRunSharedAiAction(ctx: AccessContext, actorId: ID): boolean {
  return isMember(ctx.space, actorId) && !ctx.sharedAi.suspended;
}

export function canRegisterDevice(devices: Device[], userId: ID): boolean {
  return devices.filter((d) => d.userId === userId && d.active).length < MAX_ACTIVE_DEVICES;
}

export function isTrashExpired(deletedAt: string, now: Date = new Date()): boolean {
  const ms = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return now.getTime() - new Date(deletedAt).getTime() >= ms;
}

export function purgeTrash<T extends { deletedAt: string }>(
  entries: T[],
  now: Date = new Date(),
): T[] {
  return entries.filter((e) => !isTrashExpired(e.deletedAt, now));
}

/** Filtre une liste selon `read`. */
export function visibleTo<T extends Resource>(actor: Actor, items: T[], ctx: AccessContext): T[] {
  return items.filter((i) => can(actor, "read", i, ctx));
}
