import { TYPESCRIPT_TO_CLI } from "./wrapper";
import { CliType, CliParameter } from "./types";

function cliParam(
  type: CliType,
  name: string,
  isOptional: boolean = false,
  documentation: string = null
): CliParameter {
  return {
    type,
    name,
    isOptional,
    documentation
  };
}

function prepareParams(
  parameters: CliParameter[],
  argv: string[],
  fileName: string = "dummy",
  documentation: string = null
) {
  return TYPESCRIPT_TO_CLI().prepareParams(
    {
      fileName,
      documentation,
      parameters: parameters
    },
    argv
  );
}

describe("prepareParams", () => {
  describe("boolean", () => {
    test("should handle false value", () => {
      expect(prepareParams([cliParam(CliType.Boolean, "--arg1")], [])).toEqual([
        false
      ]);
    });

    test("should handle true value", () => {
      expect(
        prepareParams([cliParam(CliType.Boolean, "--arg1")], ["--arg1"])
      ).toEqual([true]);
    });
  });

  describe("string", () => {
    test("should handle any strings", () => {
      expect(
        prepareParams([cliParam(CliType.String, "--arg1")], ["--arg1", "value"])
      ).toEqual(["value"]);
    });

    test("should handle missing value", () => {
      expect(() =>
        prepareParams([cliParam(CliType.String, "--arg1")], ["--arg1"])
      ).toThrow(new Error("Missing value for argument --arg1"));
    });
  });
});
