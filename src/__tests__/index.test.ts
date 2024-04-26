import { mock } from "jest-mock-extended";
type ScoreWithId = { id: number; score: Score };
/*
  Domain models

  Match
    Team home;
    Team away;
    updateScore(homeScore, awayScore);
    static createMatch(home, away)

  Team
    String name;

  Scoreboard
    Matches[] getSummary;
    void finishMatch(match: Match);

  DataStore
    Record<Match> matches;
    add(Match match);
    remove(Match match);

*/
// interface IMatch {
//   Match updateScore(ITeam tea)
// };

class Team {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

enum MatchStatus {
  Pending = "Pending",
  InProgress = "InProgress",
  Completed = "Completed",
}

type Score = [number, number] | undefined;
type MatchJson = {
  home: {
    name: string;
  };
  away: {
    name: string;
  };
  score: Score;
};

interface IKeyable {
  getKey(): string;
}

interface IJson {
  toJSON(): MatchJson;
}

type Criteria<T> = {
  (item: T): boolean;
};

interface IDataStore<T> {
  add(item: T): void;
  getById(id: number): T | undefined;
  getAllBy(criteria: Criteria<T>): Array<T>;
}

interface IPersistable {
  get id(): number;
  setId(id: number): void;
}

class MemoryDataStore<T extends IPersistable> implements IDataStore<T> {
  private store: Map<number, T>;
  private count: number = 0;

  constructor() {
    this.store = new Map<number, T>();
  }

  getAllBy(criteria: Criteria<T>): Array<T> {
    return Array.from(this.store.entries())
      .filter(([_, entry]: [number, T]) => criteria(entry))
      .map(([_, entry]: [number, T]) => entry);
  }

  getById(id: number): T | undefined {
    return this.store.get(id);
  }

  add(item: T): void {
    item.setId(this.count++);
    this.store.set(item.id, item);
  }
}

class Match implements IKeyable, IPersistable, IJson {
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

  getKey(): string {
    return `${this._home.name}-${this._away.name}`;
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
    return `${this.home.name} ${this.score?.[0]} - ${this.away.name} ${this.score?.[1]}`;
  }

  static createMatch(home: Team, away: Team) {
    return new Match(home, away);
  }
}

describe("Match", () => {
  it("should be able to create match", () => {
    const actual = Match.createMatch(new Team("home"), new Team("away"));
    expect(actual).toBeTruthy();
  });

  it("should be able to get home team", () => {
    const match = Match.createMatch(new Team("home"), new Team("away"));
    const actual = match.home;
    expect(actual).toEqual(new Team("home"));
  });

  it("should be able to get away team", () => {
    const match = Match.createMatch(new Team("home"), new Team("away"));
    const actual = match.away;
    expect(actual).toEqual(new Team("away"));
  });
});

describe("Team", () => {
  it("should be able to create", () => {
    const actual = new Team("home");
    expect(actual).toBeDefined();
  });
});

interface IScoreboard {
  add(match: Match): void;
  update(id: number, score: Score): void;
  getSummaries(): Array<Match>;
  getTextSummaries(): Array<string>;
}

class Scoreboard implements IScoreboard {
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
        const aTotal = a.totalScore || 0;
        const bTotal = b.totalScore || 0;

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

describe("Scoreboard", () => {
  const createMatches = (howMany: number): Array<Match> =>
    Array.from(Array(howMany).keys()).map((key: number) =>
      Match.createMatch(new Team(`home${key}`), new Team(`away${key}`)),
    );

  const generateScore = (): Score => [
    Math.round(Math.random() * 10),
    Math.round(Math.random() * 10),
  ];

  const createScore = (id: number): ScoreWithId => ({
    id,
    score: generateScore(),
  });

  let mockDataStore: IDataStore<Match>;

  beforeEach(() => {
    mockDataStore = mock<IDataStore<Match>>();
  });

  it("should be able to create", () => {
    const actual = new Scoreboard(mockDataStore);
    expect(actual).toBeDefined();
  });

  it("should be able to add match", () => {
    const scoreboard = new Scoreboard(mockDataStore);
    expect(scoreboard.add).toBeDefined();
  });

  it("should accept data store", () => {
    const actual = new Scoreboard(mockDataStore);
    expect(actual.store).toBeDefined();
  });

  it("should be able to persist a match", () => {
    const expected = Match.createMatch(new Team("home"), new Team("away"));
    const scoreboard = new Scoreboard(mockDataStore);
    scoreboard.add(expected);
    expect(mockDataStore.add).toHaveBeenCalledWith(expected);
  });

  it("should set starting score for match", () => {
    const actual = Match.createMatch(new Team("home"), new Team("away"));
    const scoreboard = new Scoreboard(new MemoryDataStore<Match>());
    scoreboard.add(actual);
    expect(actual.score).toEqual([0, 0]);
  });

  it("should update score for match", () => {
    const actual = Match.createMatch(new Team("home"), new Team("away"));
    const scoreboard = new Scoreboard(new MemoryDataStore<Match>());
    scoreboard.add(actual);
    const id = actual.id;
    scoreboard.update(id, [3, 2]);
    expect(actual.score).toEqual([3, 2]);
  });

  it("should be able to complete matches", () => {
    const actual = Match.createMatch(new Team("home"), new Team("away"));
    const scoreboard = new Scoreboard(new MemoryDataStore<Match>());
    scoreboard.add(actual);
    const id = actual.id;
    scoreboard.update(id, [3, 2]);
    scoreboard.complete(id);
    expect(actual.status).toEqual(MatchStatus.Completed);
  });

  it("should be able to mark match as in progress", () => {
    const actual = Match.createMatch(new Team("home"), new Team("away"));
    const scoreboard = new Scoreboard(new MemoryDataStore<Match>());
    scoreboard.add(actual);
    expect(actual.status).toEqual(MatchStatus.InProgress);
  });

  it("should be able to produce summary report for a single match in progress", () => {
    const actual = Match.createMatch(new Team("home"), new Team("away"));
    const scoreboard = new Scoreboard(new MemoryDataStore<Match>());
    scoreboard.add(actual);
    const id = actual.id;
    scoreboard.update(id, [3, 2]);
    const summaries: Match[] = scoreboard.getSummaries();
    expect(summaries.length).toBe(1);
    expect(summaries[0].toJSON()).toEqual({
      home: { name: "home" },
      away: { name: "away" },
      score: [3, 2],
    });
  });

  it("should be able to produce summary report for a single match in progress amongst completed", () => {
    const matches = createMatches(2);
    const scoreboard = new Scoreboard(new MemoryDataStore<Match>());

    const scores = setupInProgressScoreboard(matches, scoreboard, createScore);

    const summaries: Match[] = scoreboard.getSummaries();
    expect(summaries.length).toBe(1);
    expect(summaries[0].toJSON()).toEqual({
      home: { name: "home0" },
      away: { name: "away0" },
      score: scores.filter(({ id }: ScoreWithId) => id === matches[0].id)[0]
        .score,
    });
  });

  it("should be able to produce summary report for multiple in progress matches with some completed", () => {
    const matches = createMatches(10);
    const scoreboard = new Scoreboard(new MemoryDataStore<Match>());

    setupInProgressScoreboard(matches, scoreboard, createScore);

    const summaries = scoreboard.getSummaries();

    expect(summaries.length).toBe(5);
  });

  it("should be able to produce summaries ordered by total score", () => {
    const matches = createMatches(10);
    const scoreboard = new Scoreboard(new MemoryDataStore<Match>());

    setupInProgressScoreboard(matches, scoreboard, createScore);

    const summaries = scoreboard.getSummaries();

    const expected: Array<Match> = matches
      .filter((match: Match) => match.isInProgress)
      .sort((a: Match, b: Match) => {
        const aSum = a.totalScore || 0;
        const bSum = b.totalScore || 0;

        if (aSum > bSum) {
          return -1;
        }

        if (aSum < bSum) {
          return 1;
        }

        return b.id - a.id;
      });

    const expectedJson = expected.map((match: Match) => match.toJSON());
    expect(summaries.map((match: Match) => match.toJSON())).toEqual(
      expectedJson,
    );

    const expectedOrder = expected
      .map((match: Match) => match.totalScore || 0)
      .sort((a: number, b: number) => b - a);

    expect(summaries.map((match: Match) => match.totalScore)).toStrictEqual(
      expectedOrder,
    );
  });

  it("should be given id when persisting match", () => {
    const match = Match.createMatch(new Team("home"), new Team("away"));

    const scoreboard = new Scoreboard(new MemoryDataStore<Match>());
    scoreboard.add(match);
    expect(match.id).toEqual(0);
  });

  it("should be able to produce summaries ordered by total score and breaking tie by latest", () => {
    const matches = createMatches(10);
    const scoreboard = new Scoreboard(new MemoryDataStore<Match>());

    setupInProgressScoreboard(matches, scoreboard, createScore);

    scoreboard.update(matches[2].id, [2, 2]);
    scoreboard.update(matches[4].id, [2, 2]);

    const summaries = scoreboard.getSummaries();

    const expected: Array<Match> = matches
      .filter((match: Match) => match.isInProgress)
      .sort((a: Match, b: Match) => {
        const aSum = a.totalScore || 0;
        const bSum = b.totalScore || 0;

        if (aSum > bSum) {
          return -1;
        }

        if (aSum < bSum) {
          return 1;
        }

        if (a.id < 0 || b.id < 0) {
          return 0;
        }

        return b.id - a.id;
      });

    const expectedJson = expected.map((match: Match) => match.toJSON());
    expect(summaries.map((match: Match) => match.toJSON())).toEqual(
      expectedJson,
    );

    const expectedOrder = expected
      .map((match: Match) => match.totalScore || 0)
      .sort((a: number, b: number) => b - a);

    expect(summaries.map((match: Match) => match.totalScore)).toStrictEqual(
      expectedOrder,
    );

    const indexOfTieLoser = summaries.findIndex(
      (summary: Match) => summary.id === matches[2].id,
    );
    const indexOfTieWinner = summaries.findIndex(
      (summary: Match) => summary.id === matches[4].id,
    );

    expect(indexOfTieWinner).toBeLessThan(indexOfTieLoser);
  });

  it("should be able to produce friendly summaries", () => {
    const matches = createMatches(10);
    const scoreboard = new Scoreboard(new MemoryDataStore<Match>());

    setupInProgressScoreboard(matches, scoreboard, createScore);

    scoreboard.update(matches[2].id, [2, 2]);
    scoreboard.update(matches[4].id, [2, 2]);

    const summaries = scoreboard.getSummaries();

    const expected = summaries.map(
      (summary: Match) =>
        `${summary.home.name} ${summary.score?.[0]} - ${summary.away.name} ${summary.score?.[1]}`,
    );

    const actual = scoreboard.getTextSummaries();

    expect(actual).toStrictEqual(expected);
  });
});

describe("MemoryDataStore", () => {
  it("should assign incremental id", () => {
    class Test implements IPersistable, IKeyable {
      private _id: number = -1;
      private _name: string;
      constructor(name: string) {
        this._name = name;
      }

      setId(id: number): void {
        this._id = id;
      }

      get id(): number {
        return this._id;
      }

      getKey(): string {
        return this._name;
      }
    }
    const item: Test = new Test("test");

    const store = new MemoryDataStore();
    store.add(item);
    const actual: IPersistable | undefined = store.getById(item.id);
    expect(actual).toBeTruthy();
  });
});

function setupInProgressScoreboard(
  matches: Match[],
  scoreboard: Scoreboard,
  createScore: (id: number) => ScoreWithId,
) {
  matches.forEach((match: Match) => scoreboard.add(match));
  const scores = matches.map((match: Match) => createScore(match.id));
  scores.forEach(({ id, score }: ScoreWithId) => scoreboard.update(id, score));
  matches.forEach(
    (match: Match, index: number) => index % 2 && scoreboard.complete(match.id),
  );

  return scores;
}
