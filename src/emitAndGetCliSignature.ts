import * as ts from "typescript";
import { CliSignature, CliType, CliParameter } from "./types";
import * as path from "path";
import { replaceExtension } from "./replaceExtension";
import * as fs from "fs";
import { promisify } from "util";

const readFile = promisify(fs.readFile);

const wrapperSourceFile = `${__dirname}/wrapper.js`;

export function getCliSignature(
  program: ts.Program,
  fileName: string
): CliSignature {
  let checker = program.getTypeChecker();

  const sourceFile = program.getSourceFile(fileName);

  if (sourceFile == null) {
    throw new Error(`${fileName} not found.`);
  }

  if (sourceFile.isDeclarationFile) {
    throw new Error(`${fileName} should not be a declaration file`);
  }

  const functionDeclaration = sourceFile.statements.find(
    node =>
      ts.isFunctionDeclaration(node) &&
      ts.getCombinedModifierFlags(node) === ts.ModifierFlags.ExportDefault
  ) as ts.FunctionDeclaration | undefined;

  if (functionDeclaration === undefined) {
    throw new Error("export default function not found.");
  }

  const signature = checker.getSignatureFromDeclaration(functionDeclaration);

  if (signature === undefined) {
    throw new Error("Can't get signature from declaration.");
  }

  const cliParameters = signature.getParameters().map(param => {
    let paramType = checker.getTypeOfSymbolAtLocation(
      param,
      param.valueDeclaration
    );

    return {
      type: tsTypeToCliType(paramType),
      name: "--" + camelToKebab(param.getName()),
      documentation: getSymbolDocumentation(checker, param),
      isOptional: isTypeOptional(paramType)
    } as CliParameter;
  });

  return {
    fileName: path.parse(replaceExtension(fileName, ".js")).base,
    parameters: cliParameters,
    documentation: getSymbolDocumentation(checker, signature)
  };
}

function isTypeOptional(type: ts.Type): boolean {
  if (type.isUnion()) {
    return type.types.some(t => !!(t.flags & ts.TypeFlags.Undefined));
  }
  return false;
}

export async function emitAndGetCliSignature(
  fileName: string,
  program: ts.Program
): Promise<void> {
  const result = getCliSignature(program, fileName);

  const outputFileName = path.parse(fileName).name;

  const prepareParamsJsCode = await readFile(wrapperSourceFile, "utf-8");

  program.emit(
    undefined,
    (
      fileName: string,
      data: string,
      writeByteOrderMark: boolean,
      onError,
      sourceFiles
    ) => {
      if (outputFileName === path.parse(fileName).name) {
        ts.sys.writeFile(
          fileName,
          `#!/usr/bin/env node
${data}
${prepareParamsJsCode}
exports.default.apply(null, TYPESCRIPT_TO_CLI().execute(${JSON.stringify(
            result
          )}));
`,
          writeByteOrderMark
        );
        fs.chmodSync(fileName, "755");
        console.log(`${fileName} CLI has been generated`);
      } else {
        ts.sys.writeFile(fileName, data, writeByteOrderMark);
      }
    }
  );
}

function getSymbolDocumentation(
  checker: ts.TypeChecker,
  symbol: ts.Signature | ts.Symbol
): string | null {
  const displayPart = symbol
    .getDocumentationComment(checker)
    .find(displayPart => displayPart.kind === "text");
  return displayPart ? displayPart.text : null;
}

function tsTypeToCliType(type: ts.Type): CliType {
  if (type.flags === 67371024) {
    return CliType.Boolean;
  }
  if (type.flags === ts.TypeFlags.Number) {
    return CliType.Number;
  }
  if (type.flags === ts.TypeFlags.String) {
    return CliType.String;
  }
  if (type.isUnion() && type.types.length == 2) {
    const sortedTypesFlags = type.types.map(t => t.flags).sort((a, b) => a - b);

    if (sortedTypesFlags[1] === ts.TypeFlags.Undefined) {
      if (sortedTypesFlags[0] === ts.TypeFlags.Number) {
        return CliType.Number;
      }
      if (sortedTypesFlags[0] === ts.TypeFlags.String) {
        return CliType.String;
      }
    }
  }

  throw new Error(
    `Only boolean, number and string parameters are supported (for now...)`
  );
}

function camelToKebab(str: string) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
