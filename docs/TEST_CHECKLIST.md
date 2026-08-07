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

## Deferred verification

World-safe Supply Drop placement, rewards, player leave/rejoin recovery, and automatic next-event activation with a real event handler require later stages and are not claimed as runtime-tested yet.
