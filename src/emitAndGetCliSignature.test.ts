import * as ts from "typescript";
import { emitAndGetCliSignature } from "./emitAndGetCliSignature";
import { CliType } from "./types";

function createCliFromString(input: string) {
  const fileMap: Map<string, ts.SourceFile> = new Map([
    ["fake.ts", ts.createSourceFile("fake.ts", input, ts.ScriptTarget.ES2015)]
  ]);
  const outputs = new Map();
  const host: ts.CompilerHost = {
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
    writeFile: (fileName, text) => outputs.set(fileName, text)
  };

  const program = ts.createProgram(
    ["fake.ts"],
    {
      target: ts.ScriptTarget.ES5,
      module: ts.ModuleKind.CommonJS
    },
    host
  );
  const signature = emitAndGetCliSignature("fake.ts", program);
  return {
    output: outputs.get("fake.js"),
    signature
  };
}

describe("signature", () => {
  test("should handle number", () => {
    expect(
      createCliFromString("export default function(x: number){}").signature
        .parameters
    ).toEqual([
      {
        type: CliType.Number,
        name: "--x",
        documentation: null
      }
    ]);
  });

  test("should handle string", () => {
    expect(
      createCliFromString("export default function(x: string){}").signature
        .parameters
    ).toEqual([
      {
        type: CliType.String,
        name: "--x",
        documentation: null
      }
    ]);
  });

  test("should handle boolean", () => {
    expect(
      createCliFromString("export default function(x: boolean){}").signature
        .parameters
    ).toEqual([
      {
        type: CliType.Boolean,
        name: "--x",
        documentation: null
      }
    ]);
  });

  test("should transform camelCase to kebabCase", () => {
    expect(
      createCliFromString("export default function(fileName: string){}")
        .signature.parameters
    ).toEqual([
      {
        type: CliType.String,
        name: "--file-name",
        documentation: null
      }
    ]);
  });
});
