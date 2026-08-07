import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ENGINE_CONFIGURATION, getConfiguredSchedule } from "../behavior_packs/breeze_smp_event_engine/scripts/config/events.js";

const root = resolve(import.meta.dirname, "..");
const manifests = [
  "behavior_packs/breeze_smp_event_engine/manifest.json",
  "resource_packs/breeze_smp_event_engine/manifest.json"
];

for (const relativePath of manifests) {
  const manifest = JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
  if (manifest.format_version !== 2) throw new Error(`${relativePath}: expected format_version 2`);
  if (!manifest.header?.uuid || !Array.isArray(manifest.modules)) throw new Error(`${relativePath}: incomplete manifest`);
  console.log(`OK ${relativePath}`);
}

const schedule = getConfiguredSchedule();
if (!ENGINE_CONFIGURATION.testMode || schedule.length !== 10) {
  throw new Error("Expected the documented 10-event test schedule while test mode is enabled.");
}
if (new Set(schedule.map((event) => event.id)).size !== schedule.length) {
  throw new Error("Schedule event IDs must be unique.");
}
console.log(`OK ${schedule.length}-event test schedule (${ENGINE_CONFIGURATION.timezone.label})`);
