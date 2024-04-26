import { MemoryDataStore, IPersistable } from "@/data";

describe("MemoryDataStore", () => {
  it("should assign incremental id", () => {
    class Test implements IPersistable {
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
    }
    const item: Test = new Test("test");

    const store = new MemoryDataStore();
    store.add(item);
    const actual: IPersistable | undefined = store.getById(item.id);
    expect(actual).toBeTruthy();
  });
});
