import { TYPESCRIPT_TO_CLI } from "./wrapper";
import { CliType, CliParameter, CliTypeKind } from "./types";
import { cliParam, aSimpleType, aStringsLiterals } from "./fixtures";

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
      expect(
        prepareParams(
          [cliParam(aSimpleType(CliTypeKind.Boolean), "--arg1")],
          []
        )
      ).toEqual([false]);
    });

    test("should handle true value", () => {
      expect(
        prepareParams(
          [cliParam(aSimpleType(CliTypeKind.Boolean), "--arg1")],
          ["--arg1"]
        )
      ).toEqual([true]);
    });
  });

  describe("string", () => {
    test("should handle any strings", () => {
      expect(
        prepareParams(
          [cliParam(aSimpleType(CliTypeKind.String), "--arg1")],
          ["--arg1", "value"]
        )
      ).toEqual(["value"]);
    });

    test("should handle missing value", () => {
      expect(() =>
        prepareParams(
          [cliParam(aSimpleType(CliTypeKind.String), "--arg1")],
          ["--arg1"]
        )
      ).toThrow(new Error("Missing value for argument --arg1"));
    });
  });

  describe("optional number", () => {
    test("should handle any undefined", () => {
      expect(
        prepareParams(
          [cliParam(aSimpleType(CliTypeKind.Number), "--arg1", true)],
          []
        )
      ).toEqual([undefined]);
    });
  });

  describe("string literals", () => {
    const primaryColorsType = aStringsLiterals(["cyan", "magenta", "yellow"]);

    test("should handle allowed value", () => {
      expect(
        prepareParams(
          [cliParam(primaryColorsType, "--arg1")],
          ["--arg1", "cyan"]
        )
      ).toEqual(["cyan"]);
    });

    test("should throw if missing argument", () => {
      expect(() =>
        prepareParams([cliParam(primaryColorsType, "--arg1")], [])
      ).toThrow(new Error("Missing argument --arg1"));
    });

    test("should throw if missing value", () => {
      expect(() =>
        prepareParams([cliParam(primaryColorsType, "--arg1")], ["--arg1"])
      ).toThrow(new Error("Missing value for argument --arg1"));
    });

    test("should throw if value is not allowed", () => {
      expect(() =>
        prepareParams(
          [cliParam(primaryColorsType, "--arg1")],
          ["--arg1", "green"]
        )
      ).toThrow(
        new Error(
          "green is not allowed for --arg1. Allowed values: cyan, magenta, yellow"
        )
      );
    });

    test("should handle undefined if optional", () => {
      expect(
        prepareParams([cliParam(primaryColorsType, "--arg1", true)], [])
      ).toEqual([undefined]);
    });
  });
});
