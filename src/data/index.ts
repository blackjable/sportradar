import { Criteria, MatchJson } from "@/types";

export interface IJson {
  toJSON(): MatchJson;
}
export interface IDataStore<T> {
  add(item: T): void;
  getById(id: number): T | undefined;
  getAllBy(criteria: Criteria<T>): Array<T>;
}

export interface IPersistable {
  get id(): number;
  setId(id: number): void;
}
export class MemoryDataStore<T extends IPersistable> implements IDataStore<T> {
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
