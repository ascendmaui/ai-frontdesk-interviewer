/**
 * AUTO vs MANUAL provision into Hearthline OS
 *
 * AUTO (hiring app, no human click):
 *   - Training complete (quiz + modules + pitch) → production_ready → provision
 *   - Practice pitch complete route when root is production_ready
 *
 * MANUAL (operator):
 *   - Admin "Mark production ready" → force ready + provision (reassign)
 *   - Admin "Provision → Hearthline OS" → provision only (reassign)
 *   - OS owner session POST /api/os/provision
 */

export type OsProvisionTrigger =
  | "auto_training_complete"
  | "auto_practice_pitch_complete"
  | "manual_mark_production_ready"
  | "manual_provision_button";

export const PROVISION_TRIGGER_LABEL: Record<OsProvisionTrigger, string> = {
  auto_training_complete: "AUTO · Training complete",
  auto_practice_pitch_complete: "AUTO · Practice pitch complete",
  manual_mark_production_ready: "MANUAL · Mark production ready",
  manual_provision_button: "MANUAL · Provision button",
};
