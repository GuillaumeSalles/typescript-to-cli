import { stdout, createCliForTest, stderr } from "./utils";

describe("string", () => {
  const callCli = createCliForTest("./fixtures/string.ts");

  test("should handle any strings", async () => {
    expect(await callCli(["--x", "str"])).toEqual(stdout("str"));
  });

  test("should handle missing value", async () => {
    expect(await callCli(["--x"])).toEqual(
      stderr("Missing value for option --x\n")
    );
  });
});
