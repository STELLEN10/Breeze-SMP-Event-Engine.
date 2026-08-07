import { world } from "@minecraft/server";

/** Keeps event scores in persisted event data and can mirror aggregate points to a scoreboard. */
export class ScoreManager {
  addEventScore(event, participantName, points, checkpoint) {
    event.data ??= {};
    event.data.scores ??= {};
    event.data.scores[participantName] = (event.data.scores[participantName] ?? 0) + points;
    if (!checkpoint()) throw new Error("Could not persist event score.");
    return event.data.scores[participantName];
  }

  addSeasonPoints(player, points) {
    let objective = world.scoreboard.getObjective("breeze_points");
    if (!objective) objective = world.scoreboard.addObjective("breeze_points", "Breeze SMP Points");
    if (!player.scoreboardIdentity) throw new Error("Player does not have a scoreboard identity.");
    return objective.addScore(player.scoreboardIdentity, points);
  }
}
