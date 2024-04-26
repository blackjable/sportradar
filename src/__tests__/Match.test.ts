import { Match } from "@/Match";
import { Team } from "@/Team";

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

  it('should return undefined for total score if there is no score', () => {
    const actual = Match.createMatch(new Team('home'), new Team('away'));
    expect(actual.totalScore).toBeFalsy();
  })

  it('should return empty string for toString if there is no score', () => {
    const actual = Match.createMatch(new Team('home'), new Team('away'));
    expect(actual.toString()).toStrictEqual("");
  })

  it('should return formatted match string for toString if there is a score', () => {
    const actual = Match.createMatch(new Team('home'), new Team('away'));
    actual.updateScore([2,3])
    expect(actual.toString()).toStrictEqual("home 2 - away 3");
  })
});
