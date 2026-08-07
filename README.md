# Brizz SMP Event Engine

A safety-first Minecraft Bedrock Edition add-on for scheduled Brizz SMP events.

## Current status

Stages 1–4 are complete: the pack scaffold, configurable real-world schedule, persistent scheduler state, lifecycle, announcements, countdowns, Supply Drop, and reusable location/structure/teleport/reward/score services are implemented. The remaining event types are registered as disabled configuration gates until their rules and safe locations are explicitly designed.

## Project layout

```
behavior_packs/breeze_smp_event_engine/  Bedrock behavior pack and scripts
resource_packs/breeze_smp_event_engine/  Resource-pack shell for future sounds/textures
docs/                                    Design, compatibility, and test material
tests/                                   Offline validation scripts
```

## Configuration

Edit only [`events.js`](behavior_packs/breeze_smp_event_engine/scripts/config/events.js) for the current test schedule, timing values, and presentation settings. The schedule uses South Africa Standard Time (UTC+02:00) by default. Set `testMode` to `false` and replace `testSchedule` with `productionSchedule` when preparing a season.

Times are parsed as real-world calendar times. The engine stores only event state in the world; it never resets or recreates the world.

### Supply Drop safety configuration

Supply Drop is deliberately disabled at runtime until at least one owner-reviewed wilderness/event area is added to `supplyDrop.approvedAreas`. Example:

```js
approvedAreas: [
  { id: "northern-wilderness", dimensionId: "minecraft:overworld", centerX: 2400, centerZ: -1800, radius: 120 }
],
protectedLocations: [
  { dimensionId: "minecraft:overworld", x: 0, z: 0, radius: 500 }
]
```

The engine chooses only loaded candidates in those approved areas, requires a whitelisted natural ground block plus two air blocks, and rejects configured protected-radius overlap. It never overwrites a block. With no approved area, the event is safely skipped before warning players.

## Development installation

1. Copy `behavior_packs/breeze_smp_event_engine` to Minecraft's `development_behavior_packs` directory.
2. Copy `resource_packs/breeze_smp_event_engine` to `development_resource_packs`.
3. Activate both packs on a copy of the target world before Realm testing.
4. Turn on the Content Log and verify the `[BreezeEvents]` startup messages.

See [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) and [`docs/TEST_CHECKLIST.md`](docs/TEST_CHECKLIST.md) before testing.

## Safety guarantees in this stage

- No commands are run against the world.
- No blocks, entities, inventories, or player locations are changed.
- Missing/unimplemented event types are safely recorded as skipped; they are never announced or started.
- Warnings/countdowns are persisted before presentation, so a script reload does not repeat an already-recorded stage.
- Supply Drop places only a tracked barrel crate in empty air, after persisting its plan; it leaves the crate for players to loot rather than deleting a possibly player-modified block.
- Scheduler state is stored under one namespaced world dynamic property and survives normal world/Realm restarts.

## Packaging

Create a distributable archive with:

```powershell
powershell -ExecutionPolicy Bypass -File tools/package-mcaddon.ps1
```

The output is `dist/Breeze-SMP-Event-Engine.mcaddon` and contains only the behavior and resource packs—not a world save. The archive is structurally validated locally, but must still be imported into Minecraft before it can be considered release-tested.

## Event-library status

Supply Drop is the only enabled production event. Treasure Hunt, King of the Hill, Bounty Hunt, PvP Tournament, Mob Invasion, Capture the Flag, The Crown, Blood Moon, and Final Battle have registry/configuration gates so the scheduler can safely recognize and skip them. Their individual gameplay rules are not invented or enabled yet; Final Battle in particular requires owner-approved objectives and teams before implementation.
