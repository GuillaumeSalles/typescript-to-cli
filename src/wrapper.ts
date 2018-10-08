import { CliParameter, CliType, CliSignature, CliTypeKind } from "./types";

export function TYPESCRIPT_TO_CLI() {
  function padWithWhiteSpaces(str: string, length: number) {
    for (let i = str.length; i < length; i++) {
      str += " ";
    }
    return str;
  }

  function parameterLeftDocumentation(parameter: CliParameter): string {
    switch (parameter.type.kind) {
      case CliTypeKind.Boolean:
        return parameter.name;
      case CliTypeKind.String:
        return parameter.name + " <string>";
      case CliTypeKind.Number:
        return parameter.name + " <number>";
      default:
        throw new Error(`Unknown cli parameter type: ${parameter.type}`);
    }
  }

  function parametersDocumentation(parameters: CliParameter[]): string {
    const leftParts = parameters.map(parameterLeftDocumentation);

    const padding = Math.max(...leftParts.map(d => d.length + 2).concat(8));

    const help =
      padWithWhiteSpaces("--help", padding) + "output usage information";

    const parametersDoc = parameters
      .map(
        (parameter, i) =>
          padWithWhiteSpaces(leftParts[i], padding) +
          (parameter.documentation !== null ? parameter.documentation : "")
      )
      .join("\n");

    return help + "\n" + parametersDoc;
  }

  function help(signature: CliSignature) {
    return `Usage ${signature.fileName} [options]

${signature.documentation !== null ? signature.documentation + "\n" : ""}
Options:

${parametersDocumentation(signature.parameters)}
`;
  }

  function isNumber(num: string) {
    if (num.trim() !== "") {
      return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
    }
    return false;
  }

  function extractNumberFromArg(value: string, parameter: string): number {
    if (!isNumber(value)) {
      throw new Error(`${parameter} should be a number`);
    }
    return Number(value);
  }

  function extractValueFromArg(
    parameter: CliParameter,
    value: string
  ): string | number {
    if (value === undefined) {
      throw new Error(`Missing value for argument ${parameter.name}`);
    }

    switch (parameter.type.kind) {
      case CliTypeKind.Number:
        return extractNumberFromArg(value, parameter.name);
      case CliTypeKind.String:
        return value;
      case CliTypeKind.StringLiterals:
        if (parameter.type.values.indexOf(value) === -1) {
          throw new Error(
            `${value} is not allowed for ${
              parameter.name
            }. Allowed values: ${parameter.type.values.join(", ")}`
          );
        }
        return value;
      default:
        throw new Error(`Invalid argument type ${parameter.type.kind}`);
    }
  }

  function parseArg(
    iterator: IterableIterator<string>,
    signature: CliSignature,
    arg: string,
    finalParams: any[]
  ) {
    for (let i = 0; i < signature.parameters.length; i++) {
      let parameter = signature.parameters[i];

      if (arg === parameter.name) {
        if (parameter.type.kind === CliTypeKind.Boolean) {
          finalParams[i] = true;
        } else {
          finalParams[i] = extractValueFromArg(
            parameter,
            iterator.next().value
          );
        }
        return;
      }

      if (arg.startsWith(parameter.name + "=")) {
        finalParams[i] = extractValueFromArg(
          parameter,
          arg.slice(parameter.name.length + 1)
        );
        return;
      }
    }

    throw new Error(`Unknown argument ${arg}`);
  }

  function prepareParams(signature: CliSignature, argv: string[]): any[] {
    const finalParameters: any[] = new Array(signature.parameters.length);

    const argvIterator = argv[Symbol.iterator]();
    let iteratorItem = argvIterator.next();
    while (iteratorItem.done === false) {
      const arg = iteratorItem.value;
      parseArg(argvIterator, signature, arg, finalParameters);
      iteratorItem = argvIterator.next();
    }

    for (let i = 0; i < signature.parameters.length; i++) {
      const finalParameter = finalParameters[i];
      if (finalParameter === undefined) {
        if (signature.parameters[i].type.kind === CliTypeKind.Boolean) {
          finalParameters[i] = false;
        } else if (signature.parameters[i].isOptional === false) {
          throw new Error(`Missing argument ${signature.parameters[i].name}`);
        }
      }
    }

    return finalParameters;
  }

  return {
    prepareParams,
    help,
    execute: function(signature: CliSignature) {
      const argv = process.argv.slice(2);
      if (argv[0] === "--help") {
        process.stdout.write(help(signature));
        process.exit(0);
        return;
      }

      try {
        return prepareParams(signature, argv);
      } catch (err) {
        process.stderr.write(err.message + "\n");
        process.exit(1);
      }
    }
  };
}
