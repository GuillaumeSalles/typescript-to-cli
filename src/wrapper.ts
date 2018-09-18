import { CliParameter, CliType, CliSignature } from "./types";

function TYPESCRIPT_TO_CLI_PREPARE_PARAMS(
  signature: CliSignature,
  argv: string[]
) {
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

  function extractParamFromArgv(parameter: CliParameter, argv: string[]): any {
    if (parameter.type === CliType.Boolean) {
      return argv.some(arg => arg === parameter.name);
    }

    for (let i = 0; i < argv.length; i++) {
      if (argv[i] !== parameter.name) {
        continue;
      }

      switch (parameter.type) {
        case CliType.Number:
          return extractNumberFromArg(argv[i + 1], parameter.name);
        case CliType.String:
          return extractStringFromArg(argv[i + 1], parameter.name);
        default:
          throw new Error(`Invalid argument type ${parameter.type}`);
      }
    }

    throw new Error(`Missing argument ${parameter.name}`);
  }

  if (argv.length === 0 || argv[0] === "--help") {
    displayHelpAndExit(signature);
    return;
  }

  try {
    return signature.parameters.map(p => extractParamFromArgv(p, argv));
  } catch (err) {
    process.stderr.write(err.message);
    process.exit(1);
  }
}
