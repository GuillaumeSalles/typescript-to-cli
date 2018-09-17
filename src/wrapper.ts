import { CliParameter, CliType, CliSignature } from "./types";

function TYPESCRIPT_TO_CLI_PREPARE_PARAMS(
  signature: CliSignature,
  argv: string[]
) {
  function exitWithError(message: string) {
    process.stderr.write(message);
    process.exit(1);
  }

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

  function extractParamFromArgv(parameter: CliParameter, argv: string[]): any {
    if (parameter.type === CliType.Boolean) {
      return argv.some(arg => arg === parameter.name);
    }

    for (let i = 0; i < argv.length; i++) {
      if (argv[i] !== parameter.name) {
        continue;
      }

      switch (parameter.type) {
        case CliType.String:
          return argv[i + 1];
        case CliType.Number:
          if (isNumber(argv[i + 1])) {
            return Number(argv[i + 1]);
          }
          exitWithError(`${parameter.name} should be a number`);
        default:
          exitWithError(`Invalid argument type ${parameter.type}`);
      }
    }

    exitWithError(`Missing argument ${parameter.name}`);
  }

  if (argv.length === 0 || argv[0] === "--help") {
    displayHelpAndExit(signature);
    return;
  }

  return signature.parameters.map(p => extractParamFromArgv(p, argv));
}
