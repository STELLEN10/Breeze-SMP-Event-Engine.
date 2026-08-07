# Stage 1–2 test checklist

## Completed locally

- [ ] JSON manifests parse.
- [ ] Script module imports are syntax-checked.
- [ ] Scheduler lifecycle and announcement imports are syntax-checked.
- [ ] Pack imports into Minecraft Bedrock.
- [ ] World activates with both packs.

## Must be completed in Minecraft before Stage 3

- [ ] Create a backup/copy of the target world; never use the only Realm world as the first test.
- [ ] Import both packs without manifest errors in Content Log.
- [ ] Activate both packs and load the copied world.
- [ ] Confirm `[BreezeEvents] Scheduler started in TEST mode.` appears.
- [ ] Confirm no blocks, entities, player positions, inventories, or builds change after loading.
- [ ] Set one test event one minute in the future and confirm it is recorded as safely skipped while no handler is installed.
- [ ] Restart the world and confirm the event is not processed a second time.
- [ ] Record Bedrock version and Content Log output with the test result.

## Stage 2 presentation test

- [ ] In `events.js`, temporarily change one upcoming event's `type` to `diagnostic`; this handler changes no world data.
- [ ] Schedule that event at least 45 seconds in the future.
- [ ] Confirm one warning chat/title/action-bar announcement at the configured warning time.
- [ ] Confirm the 10-to-1 countdown is ordered, once per second, with title/action-bar output.
- [ ] Confirm `GO!` is shown only after the handler successfully starts.
- [ ] Confirm the completion message appears only after completion and cleanup succeed.
- [ ] Restart during warning/countdown and confirm previously persisted stages do not repeat.
- [ ] Verify the content log has no screen-display, sound, or particle errors.

## Stage 3 Supply Drop test

- [ ] In a disposable copy of the world, configure one owner-reviewed wilderness area and protected locations in `supplyDrop`.
- [ ] Schedule Supply Drop at least 45 seconds ahead; do not use an existing build area.
- [ ] Confirm warning, countdown, `GO!`, and one coordinate announcement appear.
- [ ] Confirm exactly one barrel appears at the announced coordinates, in air above an allowed ground block.
- [ ] Confirm the configured loot is present and that no surrounding block was replaced.
- [ ] Restart during the active event and confirm the persisted event recovers without creating a second crate.
- [ ] Confirm the barrel remains after completion and the scheduler moves on.

## Stage 4 service tests

- [ ] Confirm an approved-area candidate never intersects a configured protected radius.
- [ ] Confirm an unloaded/invalid candidate is skipped instead of forcing chunk access.
- [ ] In a disposable world, verify the teleportation manager records a return location before any event teleport and returns the player safely.
- [ ] Verify a configured reward fits in the test inventory before awarding it; inventory overflow must fail without dropping/replacing items.
- [ ] Verify event scores persist across a world restart.

## Stage 5 readiness gates

- [ ] Confirm every unconfigured event type is safely skipped before warning/starting.
- [ ] Do not set an event type's `enabled` value to `true` until its individual module, objectives, location plan, rewards, player handling, and cleanup tests exist.

## Stage 7 package test

- [x] `.mcaddon` archive builds and contains both manifests locally.
- [ ] Import `dist/Breeze-SMP-Event-Engine.mcaddon` in Minecraft Bedrock.
- [ ] Activate both packs in a copied world and verify Content Log is clean.
- [ ] Test the archive in a non-production Realm copy before using it on Breeze SMP.

## Deferred verification

World-safe Supply Drop placement, rewards, player leave/rejoin recovery, and automatic next-event activation with a real event handler require later stages and are not claimed as runtime-tested yet.
