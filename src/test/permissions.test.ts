import { describe, expect, it } from "vitest";
import {
  can,
  canRegisterDevice,
  canRunSharedAiAction,
  isTrashExpired,
  purgeTrash,
  visibleTo,
  type AccessContext,
  type Resource,
} from "@/domain/permissions";
import { canAddMember, decideProposal, editProposal, isSharedMemoryActive } from "@/domain/rules";
import { suspendSharedAi } from "@/domain/rules";
import * as S from "@/domain/schemas";
import type { Device, MemoryProposal } from "@/domain/types";

const A = { userId: "a" },
  B = { userId: "b" },
  C = { userId: "c" };
const ctx: AccessContext = {
  space: { id: "s1", memberIds: ["a", "b"] },
  sharedAi: { suspended: false, reactivationApprovals: [] },
};
const privA: Resource = { kind: "task", spaceId: "s1", visibility: "private", ownerId: "a" };
const memA: Resource = {
  kind: "memory",
  spaceId: "s1",
  visibility: "private",
  ownerId: "a",
  privateMemory: true,
};
const shared: Resource = { kind: "task", spaceId: "s1", visibility: "shared" };

describe("deny-by-default", () => {
  it("refuse acteur, ressource ou contexte manquants", () => {
    expect(can(null, "read", shared, ctx)).toBe(false);
    expect(can(A, "read", null, ctx)).toBe(false);
    expect(can(A, "read", { ...shared, visibility: "autre" as never }, ctx)).toBe(false);
    expect(can(A, "fly" as never, shared, ctx)).toBe(false);
  });
  it("refuse une ressource d'un autre espace", () => {
    expect(can(A, "read", { ...shared, spaceId: "s2" }, ctx)).toBe(false);
  });
  it("refuse un espace corrompu à 3 membres", () => {
    expect(
      can(A, "read", shared, { ...ctx, space: { id: "s1", memberIds: ["a", "b", "c"] } }),
    ).toBe(false);
  });
});

describe("isolation privé / commun", () => {
  it("propriétaire lit et modifie sa donnée privée", () => {
    expect(can(A, "read", privA, ctx)).toBe(true);
    expect(can(A, "write", privA, ctx)).toBe(true);
  });
  it("le partenaire ne peut rien faire sur la donnée privée de A", () => {
    for (const act of ["read", "write", "delete", "share"] as const)
      expect(can(B, act, privA, ctx)).toBe(false);
  });
  it("un tiers ne voit ni privé ni commun", () => {
    expect(can(C, "read", privA, ctx)).toBe(false);
    expect(can(C, "read", shared, ctx)).toBe(false);
  });
  it("privé sans propriétaire refusé", () => {
    expect(can(A, "read", { ...privA, ownerId: null }, ctx)).toBe(false);
  });
  it("mémoire privée : propriétaire seul, jamais partageable", () => {
    expect(can(A, "read", memA, ctx)).toBe(true);
    expect(can(B, "read", memA, ctx)).toBe(false);
    expect(can(A, "share", memA, ctx)).toBe(false);
  });
  it("données communes accessibles aux deux membres", () => {
    expect(can(A, "read", shared, ctx)).toBe(true);
    expect(can(B, "write", shared, ctx)).toBe(true);
  });
  it("visibleTo filtre les listes", () => {
    expect(visibleTo(B, [privA, shared, memA], ctx)).toEqual([shared]);
    expect(visibleTo(C, [privA, shared], ctx)).toEqual([]);
  });
});

describe("espace, appareils, corbeille", () => {
  it("troisième membre refusé", () => expect(canAddMember(["a", "b"])).toBe(false));
  it("deuxième membre accepté", () => expect(canAddMember(["a"])).toBe(true));
  const dev = (n: number, active = true): Device[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `d${i}`,
      userId: "a",
      label: "x",
      active,
      lastSeenAt: "",
    }));
  it("3e appareil accepté, 4e refusé", () => {
    expect(canRegisterDevice(dev(2), "a")).toBe(true);
    expect(canRegisterDevice(dev(3), "a")).toBe(false);
  });
  it("appareils inactifs ou d'autres comptes non comptés", () => {
    expect(canRegisterDevice(dev(5, false), "a")).toBe(true);
    expect(canRegisterDevice(dev(3), "b")).toBe(true);
  });
  it("corbeille : conservé à 179 jours, purgé à 180", () => {
    const now = new Date("2026-07-01T00:00:00Z");
    const d179 = new Date(now.getTime() - 179 * 864e5).toISOString();
    const d180 = new Date(now.getTime() - 180 * 864e5).toISOString();
    expect(isTrashExpired(d179, now)).toBe(false);
    expect(isTrashExpired(d180, now)).toBe(true);
    expect(purgeTrash([{ deletedAt: d179 }, { deletedAt: d180 }], now)).toHaveLength(1);
  });
});

describe("IA commune", () => {
  const off: AccessContext = { ...ctx, sharedAi: suspendSharedAi(ctx.sharedAi, "a") };
  it("autorisée si active et membre", () => {
    expect(can(A, "use_shared_ai", shared, ctx)).toBe(true);
    expect(canRunSharedAiAction(ctx, "b")).toBe(true);
  });
  it("bloquée dès la suspension, pour les deux", () => {
    expect(can(A, "use_shared_ai", shared, off)).toBe(false);
    expect(canRunSharedAiAction(off, "b")).toBe(false);
  });
  it("jamais sur une donnée privée ni pour un tiers", () => {
    expect(can(A, "use_shared_ai", privA, ctx)).toBe(false);
    expect(canRunSharedAiAction(ctx, "c")).toBe(false);
  });
});

describe("mémoire commune versionnée", () => {
  const p: MemoryProposal = {
    id: "p",
    spaceId: "s1",
    proposedBy: "a",
    content: "x",
    version: 1,
    approvals: [],
    createdAt: "",
  };
  it("active après double approbation de la même version", () => {
    const q = decideProposal(decideProposal(p, "a", "approved"), "b", "approved");
    expect(isSharedMemoryActive(q, "a", "b")).toBe(true);
  });
  it("une nouvelle version invalide les approbations précédentes", () => {
    const q = editProposal(
      decideProposal(decideProposal(p, "a", "approved"), "b", "approved"),
      "y",
    );
    expect(isSharedMemoryActive(q, "a", "b")).toBe(false);
  });
  it("une approbation d'un tiers ne compte pas", () => {
    const q = decideProposal(decideProposal(p, "a", "approved"), "c", "approved");
    expect(isSharedMemoryActive(q, "a", "b")).toBe(false);
  });
});

describe("validation des saisies", () => {
  it("véhicule : refuse les champs OBD / carburant", () => {
    expect(S.vehicleInput.safeParse({ name: "Clio" }).success).toBe(true);
    expect(S.vehicleInput.safeParse({ name: "Clio", fuelLiters: 40 }).success).toBe(false);
    expect(S.vehicleInput.safeParse({ name: "Clio", obd: {} }).success).toBe(false);
  });
  it("événement : fin avant début refusée", () => {
    expect(
      S.eventInput.safeParse({
        title: "x",
        start: "2026-01-02T10:00:00Z",
        end: "2026-01-02T09:00:00Z",
        visibility: "private",
      }).success,
    ).toBe(false);
    expect(
      S.eventInput.safeParse({
        title: "x",
        start: "2026-01-02T10:00:00Z",
        end: "2026-01-02T11:00:00Z",
        visibility: "private",
      }).success,
    ).toBe(true);
  });
  it("titre vide et visibilité inconnue refusés", () => {
    expect(
      S.taskInput.safeParse({ title: "  ", assigneeId: null, visibility: "private" }).success,
    ).toBe(false);
    expect(
      S.taskInput.safeParse({ title: "ok", assigneeId: null, visibility: "public" }).success,
    ).toBe(false);
  });
  it("dashboard : widget inconnu ou doublon refusé", () => {
    expect(S.dashboardLayoutInput.safeParse({ widgets: ["tasks", "garage"] }).success).toBe(true);
    expect(S.dashboardLayoutInput.safeParse({ widgets: ["tasks", "tasks"] }).success).toBe(false);
    expect(S.dashboardLayoutInput.safeParse({ widgets: ["finances"] }).success).toBe(false);
  });
  it("document : taille au-delà de 50 Mo refusée", () => {
    expect(
      S.documentMetaInput.safeParse({
        name: "a.pdf",
        mimeType: "application/pdf",
        sizeBytes: 51 * 1024 * 1024,
        visibility: "private",
      }).success,
    ).toBe(false);
  });
});
