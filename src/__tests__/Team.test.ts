import { Team } from "@/Team";

describe("Team", () => {
  it("should be able to create", () => {
    const actual = new Team("home");
    expect(actual).toBeDefined();
  });
});
