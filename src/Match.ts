import { Score, MatchJson, MatchStatus } from "./types";
import { Team } from "./Team";
import { IPersistable, IJson } from "./data";

export class Match implements IPersistable, IJson {
  private _home: Team;
  private _away: Team;
  private _score: Score;
  private _status: MatchStatus;
  private _id: number = -1;

  protected constructor(home: Team, away: Team) {
    this._home = home;
    this._away = away;
    this._status = MatchStatus.Pending;
  }
  get id(): number {
    return this._id;
  }
  setId(id: number): void {
    this._id = id;
  }

  get home(): Team {
    return this._home;
  }

  get away(): Team {
    return this._away;
  }

  get score(): [number, number] | undefined {
    return this._score;
  }

  get status(): MatchStatus {
    return this._status;
  }

  get isInProgress(): boolean {
    return this.status === MatchStatus.InProgress;
  }

  get totalScore(): number | undefined {
    return this.score?.reduce((acc: number, next: number) => acc + next, 0);
  }

  updateScore(nextScore: Score) {
    this._score = nextScore;
  }

  updateStatus(status: MatchStatus) {
    this._status = status;
  }

  start() {
    this.updateStatus(MatchStatus.InProgress);
  }

  toJSON(): MatchJson {
    return {
      home: { name: this.home.name },
      away: { name: this.away.name },
      score: this.score,
    };
  }

  toString(): string {
    if (!this.score) {
      return "";
    }

    return `${this.home.name} ${this.score?.[0]} - ${this.away.name} ${this.score?.[1]}`;
  }

  static createMatch(home: Team, away: Team) {
    return new Match(home, away);
  }
}
