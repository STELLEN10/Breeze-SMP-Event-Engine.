# Stage 1 test checklist

## Completed locally

- [ ] JSON manifests parse.
- [ ] Script module imports are syntax-checked.
- [ ] Pack imports into Minecraft Bedrock.
- [ ] World activates with both packs.

## Must be completed in Minecraft before Stage 2

- [ ] Create a backup/copy of the target world; never use the only Realm world as the first test.
- [ ] Import both packs without manifest errors in Content Log.
- [ ] Activate both packs and load the copied world.
- [ ] Confirm `[BreezeEvents] Scheduler started in TEST mode.` appears.
- [ ] Confirm no blocks, entities, player positions, inventories, or builds change after loading.
- [ ] Set one test event one minute in the future and confirm it is recorded as safely skipped while no handler is installed.
- [ ] Restart the world and confirm the event is not processed a second time.
- [ ] Record Bedrock version and Content Log output with the test result.

## Deferred verification

Warnings, countdowns, world-safe Supply Drop placement, rewards, player rejoin recovery, and automatic next-event activation require later stages and are not claimed as working yet.
