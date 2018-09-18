import { stdout, stderr, createCliForTest } from "./utils";

describe("number", () => {
  const callCli = createCliForTest("./fixtures/number.ts");

  test("should handle positive integers", async () => {
    expect(await callCli(["--x", "1"])).toEqual(stdout("1"));
  });

  test("should handle negative integers", async () => {
    expect(await callCli(["--x", "-1"])).toEqual(stdout("-1"));
  });

  test("should handle positive floats", async () => {
    expect(await callCli(["--x", "1.234"])).toEqual(stdout("1.234"));
  });

  test("should handle missing value", async () => {
    expect(await callCli(["--x"])).toEqual(
      stderr("Missing value for argument --x\n")
    );
  });
});
