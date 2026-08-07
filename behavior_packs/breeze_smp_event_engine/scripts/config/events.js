export const ENGINE_CONFIGURATION = {
  seasonId: "breeze-smp-season-1",
  testMode: true,
  timezone: {
    label: "South Africa Standard Time",
    utcOffsetMinutes: 120
  },
  timings: {
    warningSeconds: 30,
    countdownSeconds: 10,
    defaultEventDurationSeconds: 120,
    schedulerIntervalTicks: 20,
    missedEventGraceSeconds: 60
  },
  testSchedule: [
    { id: "test-supply-drop", type: "supply_drop", name: "Supply Drop", date: "2026-08-07", time: "15:00" },
    { id: "test-treasure-hunt", type: "treasure_hunt", name: "Treasure Hunt", date: "2026-08-07", time: "15:30" },
    { id: "test-king-of-the-hill", type: "king_of_the_hill", name: "King of the Hill", date: "2026-08-07", time: "16:00" },
    { id: "test-bounty-hunt", type: "bounty_hunt", name: "Bounty Hunt", date: "2026-08-07", time: "16:30" },
    { id: "test-pvp-tournament", type: "pvp_tournament", name: "PvP Tournament", date: "2026-08-07", time: "17:00" },
    { id: "test-mob-invasion", type: "mob_invasion", name: "Mob Invasion", date: "2026-08-07", time: "17:30" },
    { id: "test-capture-the-flag", type: "capture_the_flag", name: "Capture the Flag", date: "2026-08-07", time: "18:00" },
    { id: "test-the-crown", type: "the_crown", name: "The Crown", date: "2026-08-07", time: "18:30" },
    { id: "test-blood-moon", type: "blood_moon", name: "Blood Moon", date: "2026-08-07", time: "19:00" },
    { id: "test-final-battle", type: "final_battle", name: "Final Battle", date: "2026-08-07", time: "19:30" }
  ],
  productionSchedule: []
};

export function getConfiguredSchedule() {
  return ENGINE_CONFIGURATION.testMode
    ? ENGINE_CONFIGURATION.testSchedule
    : ENGINE_CONFIGURATION.productionSchedule;
}
