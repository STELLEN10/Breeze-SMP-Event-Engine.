# Compatibility and runtime model

## Target

The Stage 1 packs target modern Minecraft Bedrock Edition with a minimum engine version of 1.21.0 and the stable `@minecraft/server` 2.1.0 dependency. No Beta APIs or Bedrock Dedicated Server-only APIs are used, so the intended deployment target is a Bedrock Realm as well as local development worlds.

Microsoft's current stable Script API documentation lists `@minecraft/server` 2.1.0 as the manifest dependency. Script modules require a JavaScript entry point in the behavior pack manifest.

## Persistence

The scheduler serializes a small namespaced state object to the world's dynamic properties. That state contains completed/skipped IDs, a future active-event record, and a timestamp. It does not serialize player inventories, blocks, or world content.

If state cannot be read or written, the engine logs the failure and performs no world-changing work. It will not infer cleanup actions from damaged state.

## Time

The schedule is evaluated using JavaScript wall-clock time (`Date.now()`), not Minecraft day/night time. Schedule entries are converted from the configured fixed UTC offset; South Africa Standard Time is UTC+02:00 and has no daylight-saving transition.

Realms do not expose a supported external clock-synchronization API to this pack. The engine therefore relies on the Realm host's JavaScript clock. Before a live season, test the test schedule against a known UTC timestamp and verify the content log. A future optional web-backed scheduler would require a non-Realm server integration and is out of scope for this pack.

## Deliberate Stage 1 behaviour

Event types have no handlers yet. If one becomes due, it is persisted as `skipped` rather than started late. This protects the existing SMP while Supply Drop and its validation/cleanup design are implemented.
