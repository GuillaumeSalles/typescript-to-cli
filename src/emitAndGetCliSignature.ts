import * as ts from "typescript";
import { CliSignature, CliType } from "./types";
import * as path from "path";
import { replaceExtension } from "./replaceExtension";
import * as fs from "fs";
import { promisify } from "util";

const readFile = promisify(fs.readFile);

const wrapperSourceFile = `${__dirname}/wrapper.js`;

export async function emitAndGetCliSignature(
  fileName: string,
  program: ts.Program
): Promise<void> {
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
      documentation: getSymbolDocumentation(checker, param)
    };
  });

  const outputFileName = path.parse(fileName).name;

  const prepareParamsJsCode = await readFile(wrapperSourceFile, "utf-8");

  const result = {
    fileName: path.parse(replaceExtension(fileName, ".js")).base,
    parameters: cliParameters,
    documentation: getSymbolDocumentation(checker, signature)
  };

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
exports.default.apply(null, TYPESCRIPT_TO_CLI_PREPARE_PARAMS(${JSON.stringify(
            result
          )}, process.argv.slice(2)));
`,
          writeByteOrderMark
        );
        fs.chmodSync(fileName, "755");
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

function tsTypeToCliType(type: ts.Type) {
  if (type.flags === ts.TypeFlags.Number) {
    return CliType.Number;
  }
  if (type.flags === ts.TypeFlags.String) {
    return CliType.String;
  }
  if (type.flags === 67371024) {
    return CliType.Boolean;
  }

  throw new Error(
    `Only boolean, number and string parameters are supported (for now...)`
  );
}

function camelToKebab(str: string) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
