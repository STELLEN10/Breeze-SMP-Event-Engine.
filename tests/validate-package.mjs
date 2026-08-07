import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const behaviorManifest = JSON.parse(await readFile(resolve(root, "behavior_packs/breeze_smp_event_engine/manifest.json"), "utf8"));
const resourceManifest = JSON.parse(await readFile(resolve(root, "resource_packs/breeze_smp_event_engine/manifest.json"), "utf8"));

const scriptModule = behaviorManifest.modules.find((module) => module.type === "script");
if (!scriptModule?.entry) throw new Error("Behavior pack must declare a script entry point.");
if (!behaviorManifest.dependencies.some((dependency) => dependency.module_name === "@minecraft/server")) {
  throw new Error("Behavior pack must declare @minecraft/server.");
}
if (!behaviorManifest.dependencies.some((dependency) => dependency.uuid === resourceManifest.header.uuid)) {
  throw new Error("Behavior pack must depend on this resource pack UUID.");
}
console.log("OK pack dependency and script entry validation");
