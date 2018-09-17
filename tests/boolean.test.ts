import { createCliForTest, stdout } from "./utils";

describe("boolean", () => {
  const callCli = createCliForTest("./fixtures/boolean.ts");

  test("should handle boolean", async () => {
    expect(await callCli(["--x", "true"])).toEqual(stdout("true"));
  });
});
