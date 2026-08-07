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

## Stage 2 lifecycle and presentation

Registered events follow this lifecycle where implemented: `onWarning`, `onCountdown`, `onStart`, `onTick`, `onPlayerJoin`, `onComplete`, `onCleanup`, and `onRecover`. The scheduler persists pending/active state before starting an event. An event that misses the configured five-second safe start window is skipped, rather than unexpectedly starting late after downtime.

Announcements use stable screen-display APIs for chat, title, subtitle, and action-bar text. Per-player sound and optional particles are presentation-only and individually error-isolated. They can be disabled in configuration. No command is executed by the announcement system.

## Deliberate current behaviour

No runnable event type is registered until Supply Drop is implemented in Stage 3. When an unimplemented event reaches its warning window it is persisted as `skipped`; it is never announced or started. This protects the existing SMP while placement validation and cleanup design are implemented.
