import { mock } from "jest-mock-extended";
import { Score, MatchStatus } from "@/types";
import { Match } from "@/Match";
import { IDataStore, MemoryDataStore } from "@/data";
import { Scoreboard } from "@/Scoreboard";
import { Team } from "@/Team";

type ScoreWithId = { id: number; score: Score };

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
