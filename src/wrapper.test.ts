import { TYPESCRIPT_TO_CLI } from "./wrapper";
import { CliType, CliParameter, CliTypeKind } from "./types";
import { cliParam, aSimpleType, aStringsLiterals } from "./fixtures";

describe("prepareParams", () => {
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

  test("should handle unknow option", () => {
    expect(() =>
      prepareParams(
        [cliParam(aSimpleType(CliTypeKind.String), "--color")],
        ["--xxx"]
      )
    ).toThrow(new Error(`Unknown option --xxx`));
  });

  test("should handle typo", () => {
    expect(() =>
      prepareParams(
        [cliParam(aSimpleType(CliTypeKind.String), "--color")],
        ["--coolr"]
      )
    ).toThrow(
      new Error(`Unknown option --coolr

Did you mean --color?`)
    );
  });

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
      ).toThrow(new Error("Missing value for option --arg1"));
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
      ).toThrow(new Error("Missing value for option --arg1"));
    });

    test("should throw if value is not allowed", () => {
      expect(() =>
        prepareParams(
          [cliParam(primaryColorsType, "--arg1")],
          ["--arg1", "green"]
        )
      ).toThrow(
        new Error(
          `--arg1 does not accept the value "green". Allowed values: cyan, magenta, yellow`
        )
      );
    });

    test("should suggest if value contains a typo", () => {
      expect(() =>
        prepareParams(
          [cliParam(primaryColorsType, "--arg1")],
          ["--arg1", "cayn"]
        )
      ).toThrow(
        new Error(
          `--arg1 does not accept the value "cayn". Allowed values: cyan, magenta, yellow

Did you mean cyan?`
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

describe("help", () => {
  function help(
    parameters: CliParameter[],
    fileName: string = "dummy",
    documentation: string = null
  ) {
    return TYPESCRIPT_TO_CLI().help({
      fileName,
      documentation,
      parameters: parameters
    });
  }

  test("number without documentation", () => {
    expect(
      help(
        [cliParam(aSimpleType(CliTypeKind.Number), "--arg1", false)],
        "dummy.js",
        "Description"
      )
    ).toBe(`Usage dummy.js [options]

Description

Options:

--help           output usage information
--arg1 <number>  
`);
  });

  test("optional number without documentation", () => {
    expect(
      help(
        [cliParam(aSimpleType(CliTypeKind.Number), "--arg1", true)],
        "dummy.js",
        "Description"
      )
    ).toBe(`Usage dummy.js [options]

Description

Options:

--help           output usage information
--arg1 [number]  
`);
  });

  test("strings literals", () => {
    expect(
      help(
        [
          cliParam(
            aStringsLiterals(["cyan", "magenta", "yellow"]),
            "--color",
            false
          )
        ],
        "dummy.js",
        "Description"
      )
    ).toBe(`Usage dummy.js [options]

Description

Options:

--help                         output usage information
--color <cyan|magenta|yellow>  
`);
  });
});
