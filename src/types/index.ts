export enum MatchStatus {
  Pending = "Pending",
  InProgress = "InProgress",
  Completed = "Completed",
}
export type Score = [number, number] | undefined;
export type MatchJson = {
  home: {
    name: string;
  };
  away: {
    name: string;
  };
  score: Score;
};
export type Criteria<T> = {
  (item: T): boolean;
};
