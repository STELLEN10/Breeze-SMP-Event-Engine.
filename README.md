# Brizz SMP Event Engine

A safety-first Minecraft Bedrock Edition add-on for scheduled Breeze SMP events.

## Stage 1 status

This repository currently provides the pack scaffold, configurable real-world schedule, persistent scheduler state, test mode, and event registry. It does **not** yet place structures, teleport players, grant rewards, or alter terrain. The first complete event will be Supply Drop in Stage 3.

## Project layout

```
behavior_packs/breeze_smp_event_engine/  Bedrock behavior pack and scripts
resource_packs/breeze_smp_event_engine/  Resource-pack shell for future sounds/textures
docs/                                    Design, compatibility, and test material
tests/                                   Offline validation scripts
```

## Configuration

Edit only [`events.js`](behavior_packs/breeze_smp_event_engine/scripts/config/events.js) for the current test schedule and timing values. The schedule uses South Africa Standard Time (UTC+02:00) by default. Set `testMode` to `false` and replace `testSchedule` with `productionSchedule` when preparing a season.

Times are parsed as real-world calendar times. The engine stores only event state in the world; it never resets or recreates the world.

## Development installation

1. Copy `behavior_packs/breeze_smp_event_engine` to Minecraft's `development_behavior_packs` directory.
2. Copy `resource_packs/breeze_smp_event_engine` to `development_resource_packs`.
3. Activate both packs on a copy of the target world before Realm testing.
4. Turn on the Content Log and verify the `[BreezeEvents]` startup messages.

See [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) and [`docs/TEST_CHECKLIST.md`](docs/TEST_CHECKLIST.md) before testing.

## Safety guarantees in this stage

- No commands are run against the world.
- No blocks, entities, inventories, or player locations are changed.
- Missed unimplemented events are safely recorded as skipped; they are never started late.
- Scheduler state is stored under one namespaced world dynamic property and survives normal world/Realm restarts.

## Packaging

Packaging as a `.mcaddon` is intentionally deferred until pack import and Supply Drop have been tested. The eventual package will contain the two pack directories, not a world save.
