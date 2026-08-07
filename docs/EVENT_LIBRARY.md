# Event library delivery status

## Implemented and safe to configure

- **Supply Drop** — a random crate location is selected only inside owner-reviewed areas. It requires loaded terrain, whitelisted ground, two air blocks, and protected-radius clearance. It never overwrites a block.

## Registered but deliberately disabled

- Treasure Hunt
- King of the Hill
- Bounty Hunt
- PvP Tournament
- Mob Invasion
- Capture the Flag
- The Crown
- Blood Moon
- Final Battle

Each is visible to the scheduler through the event registry. Until an event's bespoke gameplay module and owner-approved configuration are implemented, its lifecycle rejects scheduling and the engine records it as skipped before messaging players.

This is intentional: enabling unreviewed mechanics could teleport players, mutate terrain, or award incorrect rewards. Final Battle has no supplied rules, so no rules were assumed.
