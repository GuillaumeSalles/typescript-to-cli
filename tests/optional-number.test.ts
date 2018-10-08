import { stdout, stderr, createCliForTest } from "./utils";

describe("optional-number", () => {
  const callCli = createCliForTest("./fixtures/optional-number.ts");

  test("should handle positive integers", async () => {
    expect(await callCli(["--x", "1"])).toEqual(stdout("1"));
  });

  test("should handle undefined values", async () => {
    expect(await callCli([])).toEqual(stdout("undefined"));
  });
});
