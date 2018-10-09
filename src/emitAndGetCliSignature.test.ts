import { getCliSignature } from "./emitAndGetCliSignature";
import * as ts from "typescript";
import { CliSignature, CliType, CliTypeKind } from "./types";
import { cliParam, aSimpleType, aStringsLiterals } from "./fixtures";

describe("getCliSignature", () => {
  test("boolean", () => {
    expect(
      getCliMetadataFromString(`
      export default function(x: boolean) {}`).parameters
    ).toEqual([cliParam(aSimpleType(CliTypeKind.Boolean), "--x", false)]);
  });

  test("optional number", () => {
    expect(
      getCliMetadataFromString(`
      export default function(x: number | undefined) {}`).parameters
    ).toEqual([cliParam(aSimpleType(CliTypeKind.Number), "--x", true)]);
  });

  test("optional number with ?", () => {
    expect(
      getCliMetadataFromString(`
      export default function(x?: number) {}`).parameters
    ).toEqual([cliParam(aSimpleType(CliTypeKind.Number), "--x", true)]);
  });

  test("string literals", () => {
    expect(
      getCliMetadataFromString(`
      export default function(x: 'cyan' | 'majenta' | 'yellow') {}`).parameters
    ).toEqual([
      cliParam(aStringsLiterals(["cyan", "majenta", "yellow"]), "--x", false)
    ]);
  });

  test("optional string literals", () => {
    expect(
      getCliMetadataFromString(`
      export default function(x: 'cyan' | 'majenta' | 'yellow' | undefined) {}`)
        .parameters
    ).toEqual([
      cliParam(aStringsLiterals(["cyan", "majenta", "yellow"]), "--x", true)
    ]);
  });
});

function getCliMetadataFromString(source: string): CliSignature {
  const program = ts.createProgram(
    ["dummy.ts"],
    {
      strictNullChecks: true
    },
    createSandboxCompilerHost(source)
  );
  return getCliSignature(program, "dummy.ts");
}

function createSandboxCompilerHost(source: string): ts.CompilerHost {
  const fileMap: Map<string, ts.SourceFile> = new Map([
    [
      "dummy.ts",
      ts.createSourceFile("dummy.ts", source, ts.ScriptTarget.Latest)
    ]
  ]);
  const host = {
    getSourceFile: fileName => fileMap.get(fileName),
    getDefaultLibFileName: () => "lib.d.ts",
    getCurrentDirectory: () => "",
    getDirectories: () => [],
    getCanonicalFileName: fileName => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    fileExists: fileName => fileMap.has(fileName),
    readFile: fileName =>
      fileMap.has(fileName) ? fileMap.get(fileName)!.text : undefined,
    writeFile: (fileName, text) => {
      throw new Error(fileName);
    }
  };
  return host;
}
