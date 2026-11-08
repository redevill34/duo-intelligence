/** Validation des entrées (zod). Le serveur futur devra valider à nouveau. */
import { z } from "zod";

const id = z.string().min(1).max(64);
const iso = z.string().datetime();
const visibility = z.enum(["private", "shared"]);
const text = (max: number) => z.string().trim().min(1).max(max);

export const taskInput = z.object({ title: text(200), assigneeId: id.nullable(), visibility, dueDate: iso.optional() });
export const shoppingItemInput = z.object({ label: text(120), quantity: z.string().trim().max(40).optional() });
export const reminderInput = z.object({ title: text(200), dueAt: iso, visibility });
export const eventInput = z
  .object({ title: text(200), start: iso, end: iso, visibility })
  .refine((e) => new Date(e.end) >= new Date(e.start), { message: "La fin doit suivre le début", path: ["end"] });
export const vehicleInput = z.object({
  name: text(80),
  plate: z.string().trim().max(20).optional(),
  mileageKm: z.number().int().min(0).max(5_000_000).optional(),
}).strict(); // .strict : refuse tout champ OBD/carburant/péage/stationnement
export const vehicleMaintenanceInput = z.object({
  kind: z.enum(["revision", "controle_technique", "pneus", "assurance", "reparation", "autre"]),
  date: iso,
  mileageKm: z.number().int().min(0).optional(),
  note: z.string().max(1000).optional(),
}).strict();
export const homeMaintenanceInput = z.object({ title: text(200), date: iso, nextDue: iso.optional(), note: z.string().max(1000).optional() });
export const documentMetaInput = z.object({
  name: text(255),
  mimeType: z.string().min(1).max(127),
  sizeBytes: z.number().int().min(0).max(50 * 1024 * 1024),
  visibility,
});
export const memoryProposalInput = z.object({ content: text(2000) });
export const conversationInput = z.object({ title: text(120) });
export const dashboardLayoutInput = z.object({
  widgets: z
    .array(z.enum(["agenda_today", "tasks", "shopping", "reminders", "garage", "home", "projects", "recent_documents"]))
    .max(8)
    .refine((w) => new Set(w).size === w.length, { message: "Widget en double" }),
});
export const deviceInput = z.object({ label: text(60) });
