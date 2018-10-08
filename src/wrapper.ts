import { CliParameter, CliType, CliSignature } from "./types";

export function TYPESCRIPT_TO_CLI() {
  function padWithWhiteSpaces(str: string, length: number) {
    for (let i = str.length; i < length; i++) {
      str += " ";
    }
    return str;
  }

  function parameterLeftDocumentation(parameter: CliParameter): string {
    switch (parameter.type) {
      case CliType.Boolean:
        return parameter.name;
      case CliType.String:
        return parameter.name + " <string>";
      case CliType.Number:
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

  function displayHelpAndExit(signature: CliSignature) {
    process.stdout.write(
      `Usage ${signature.fileName} [options]

${signature.documentation !== null ? signature.documentation + "\n" : ""}
Options:

${parametersDocumentation(signature.parameters)}
`
    );
    process.exit(0);
  }

  function isNumber(num: string) {
    if (num.trim() !== "") {
      return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
    }
    return false;
  }

  function extractStringFromArg(
    value: string | undefined,
    parameter: string
  ): string {
    if (value === undefined) {
      throw new Error(`Missing value for argument ${parameter}`);
    }
    return value;
  }

  function extractNumberFromArg(
    value: string | undefined,
    parameter: string
  ): number {
    if (value === undefined) {
      throw new Error(`Missing value for argument ${parameter}`);
    }
    if (!isNumber(value)) {
      throw new Error(`${parameter} should be a number`);
    }
    return Number(value);
  }

  function extractValueFromArg(
    parameter: CliParameter,
    value: string
  ): string | number {
    switch (parameter.type) {
      case CliType.Number:
        return extractNumberFromArg(value, parameter.name);
      case CliType.String:
        return extractStringFromArg(value, parameter.name);
      default:
        throw new Error(`Invalid argument type ${parameter.type}`);
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
        if (parameter.type === CliType.Boolean) {
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
        if (signature.parameters[i].type === CliType.Boolean) {
          finalParameters[i] = false;
        } else if (signature.parameters[i].isOptional === false) {
          throw new Error(`Missing argument ${signature.parameters[i].name}`);
        }
      }
    }

    return finalParameters;
  }

  return {
    prepareParams: prepareParams,
    execute: function(signature: CliSignature) {
      const argv = process.argv.slice(2);
      if (argv[0] === "--help") {
        displayHelpAndExit(signature);
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
