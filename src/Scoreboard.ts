import { Score, MatchStatus } from "./types";
import { Match } from "./Match";
import { IDataStore } from "./data";

interface IScoreboard {
  add(match: Match): void;
  update(id: number, score: Score): void;
  getSummaries(): Array<Match>;
  getTextSummaries(): Array<string>;
}
export class Scoreboard implements IScoreboard {
  private _store: IDataStore<Match>;
  constructor(store: IDataStore<Match>) {
    this._store = store;
  }

  get store() {
    return this._store;
  }

  add(match: Match): void {
    match.updateScore([0, 0]);
    match.updateStatus(MatchStatus.InProgress);
    match.start();
    this._store.add(match);
  }

  update(id: number, score: Score) {
    const match = this._store.getById(id) as Match;
    match?.updateScore(score);
  }

  complete(id: number) {
    const match = this._store.getById(id) as Match;
    match?.updateStatus(MatchStatus.Completed);
  }

  getSummaries(): Array<Match> {
    return this.store
      .getAllBy((match: Match) => match.isInProgress)
      .sort((a: Match, b: Match) => {
        const aTotal = a.totalScore ?? 0;
        const bTotal = b.totalScore ?? 0;

        if (aTotal > bTotal) {
          return -1;
        }

        if (aTotal < bTotal) {
          return 1;
        }

        return b.id - a.id;
      });
  }

  getTextSummaries(): string[] {
    return this.getSummaries().map((summary: Match) => summary.toString());
  }
}
