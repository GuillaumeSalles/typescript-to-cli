import { createCliForTest, stdout } from "./utils";

describe("boolean", () => {
  const callCli = createCliForTest("./fixtures/boolean.ts");

  test("should handle true value", async () => {
    expect(await callCli(["--x"])).toEqual(stdout("true"));
  });

  test("should handle false value", async () => {
    expect(await callCli([])).toEqual(stdout("false"));
  });
});
