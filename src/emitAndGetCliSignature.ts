import * as ts from "typescript";
import { CliSignature, CliType } from "./types";
import * as path from "path";
import { replaceExtension } from "./replaceExtension";

export function emitAndGetCliSignature(
  fileName: string,
  program: ts.Program
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
      documentation: getSymbolDocumentation(checker, param)
    };
  });

  // const transformerFactory: ts.TransformerFactory<ts.SourceFile> = (
  //   context: ts.TransformationContext
  // ) => {
  //   function visitor(ctx: ts.TransformationContext, sf: ts.SourceFile) {
  //     const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
  //       if (
  //         ts.isFunctionDeclaration(node) &&
  //         ts.getCombinedModifierFlags(node) === ts.ModifierFlags.ExportDefault
  //       ) {
  //         return ts.createFunctionDeclaration(
  //           node.decorators,
  //           node.modifiers,
  //           node.asteriskToken,
  //           "ENTRY_POINT",
  //           node.typeParameters,
  //           node.parameters,
  //           node.type,
  //           node.body
  //         );
  //       }
  //       return ts.visitEachChild(node, visitor, ctx);
  //     };
  //     return visitor;
  //   }

  //   return (sf: ts.SourceFile) => {
  //     return ts.visitNode(sf, visitor(context, sf));
  //   };
  // };

  program.emit(sourceFile, undefined, undefined, undefined, {
    // before: [transformerFactory]
  });

  return {
    fileName: path.parse(replaceExtension(fileName, ".js")).base,
    parameters: cliParameters,
    documentation: getSymbolDocumentation(checker, signature)
  };
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
