/** Validation des entrées (zod). Le serveur futur devra valider à nouveau. */
import { z } from "zod";

const id = z.string().min(1).max(64);
const iso = z.string().datetime();
const visibility = z.enum(["private", "shared"]);
const text = (max: number) => z.string().trim().min(1).max(max);

export const taskInput = z.object({
  title: text(200),
  assigneeId: id.nullable(),
  visibility,
  dueDate: iso.optional(),
});
export const shoppingItemInput = z.object({
  label: text(120),
  quantity: z.string().trim().max(40).optional(),
});
export const reminderInput = z.object({ title: text(200), dueAt: iso, visibility });
export const eventInput = z
  .object({ title: text(200), start: iso, end: iso, visibility })
  .refine((e) => new Date(e.end) >= new Date(e.start), {
    message: "La fin doit suivre le début",
    path: ["end"],
  });
export const vehicleInput = z
  .object({
    name: text(80),
    plate: z.string().trim().max(20).optional(),
    mileageKm: z.number().int().min(0).max(5_000_000).optional(),
  })
  .strict(); // .strict : refuse tout champ OBD/carburant/péage/stationnement
export const vehicleMaintenanceInput = z
  .object({
    kind: z.enum(["revision", "controle_technique", "pneus", "assurance", "reparation", "autre"]),
    date: iso,
    mileageKm: z.number().int().min(0).optional(),
    note: z.string().max(1000).optional(),
  })
  .strict();
export const homeMaintenanceInput = z.object({
  title: text(200),
  date: iso,
  nextDue: iso.optional(),
  note: z.string().max(1000).optional(),
});
export const documentMetaInput = z.object({
  name: text(255),
  mimeType: z.string().min(1).max(127),
  sizeBytes: z
    .number()
    .int()
    .min(0)
    .max(50 * 1024 * 1024),
  visibility,
});
export const memoryProposalInput = z.object({ content: text(2000) });
export const conversationInput = z.object({ title: text(120) });
export const dashboardLayoutInput = z.object({
  widgets: z
    .array(
      z.enum([
        "agenda_today",
        "tasks",
        "shopping",
        "reminders",
        "garage",
        "home",
        "projects",
        "recent_documents",
      ]),
    )
    .max(8)
    .refine((w) => new Set(w).size === w.length, { message: "Widget en double" }),
});
export const deviceInput = z.object({ label: text(60) });

// Entire local snapshot: reject unknown fields and malformed imported data.
const sharedAiSchema = z.object({ suspended: z.boolean(), suspendedAt: iso.optional(), suspendedBy: id.optional(), reactivationApprovals: z.array(id).max(2) }).strict();
export const localSnapshotSchema = z.object({
  sharedAi: sharedAiSchema,
  tasks: z.array(taskInput.extend({ id, spaceId: id, status: z.enum(["todo", "doing", "done"]), projectId: id.optional() }).strict()).max(10000),
  events: z.array(z.object({ id, spaceId: id, title: text(200), start: iso, end: iso, visibility, ownerId: id }).strict().refine(e => e.end >= e.start)).max(10000),
  conversations: z.array(z.object({ id, spaceId: id, title: text(120), visibility, participantIds: z.array(id).min(1).max(2), createdBy: id, createdAt: iso, updatedAt: iso }).strict()).max(10000),
  proposals: z.array(z.object({ id, spaceId: id, proposedBy: id, content: text(2000), version: z.number().int().positive(), approvals: z.array(z.object({ userId: id, version: z.number().int().positive(), decision: z.enum(["approved", "refused"]), decidedAt: iso }).strict()).max(100), createdAt: iso }).strict()).max(10000),
}).strict();
export type LocalSnapshot = z.infer<typeof localSnapshotSchema>;
export const vaultIdentitySchema = z.object({ userId: id, spaceId: id }).strict();
export const encryptedVaultSchema = z.object({
  format: z.literal("duo-vault"), version: z.literal(1),
  kdf: z.literal("PBKDF2-SHA256"), iterations: z.literal(600000),
  salt: z.string().regex(/^[A-Za-z0-9+/]{22}==$/),
  iv: z.string().regex(/^[A-Za-z0-9+/]{16}$/),
  ciphertext: z.string().min(24).max(28000000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
}).strict();
