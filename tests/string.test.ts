import { stdout, createCliForTest } from "./utils";

describe("string", () => {
  const callCli = createCliForTest("./fixtures/string.ts");

  test("should handle any strings", async () => {
    expect(await callCli(["--x", "str"])).toEqual(stdout("str"));
  });
});
