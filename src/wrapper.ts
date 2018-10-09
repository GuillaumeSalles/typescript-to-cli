import { CliParameter, CliType, CliSignature, CliTypeKind } from "./types";

export function TYPESCRIPT_TO_CLI() {
  var arr: any[] = [];
  var charCodeCache: any[] = [];
  /**
   * https://github.com/sindresorhus/leven
   */
  function leven(a, b) {
    if (a === b) {
      return 0;
    }

    var swap = a;

    // Swapping the strings if `a` is longer than `b` so we know which one is the
    // shortest & which one is the longest
    if (a.length > b.length) {
      a = b;
      b = swap;
    }

    var aLen = a.length;
    var bLen = b.length;

    // Performing suffix trimming:
    // We can linearly drop suffix common to both strings since they
    // don't increase distance at all
    // Note: `~-` is the bitwise way to perform a `- 1` operation
    while (aLen > 0 && a.charCodeAt(~-aLen) === b.charCodeAt(~-bLen)) {
      aLen--;
      bLen--;
    }

    // Performing prefix trimming
    // We can linearly drop prefix common to both strings since they
    // don't increase distance at all
    var start = 0;

    while (start < aLen && a.charCodeAt(start) === b.charCodeAt(start)) {
      start++;
    }

    aLen -= start;
    bLen -= start;

    if (aLen === 0) {
      return bLen;
    }

    var bCharCode;
    var ret;
    var tmp;
    var tmp2;
    var i = 0;
    var j = 0;

    while (i < aLen) {
      charCodeCache[i] = a.charCodeAt(start + i);
      arr[i] = ++i;
    }

    while (j < bLen) {
      bCharCode = b.charCodeAt(start + j);
      tmp = j++;
      ret = j;

      for (i = 0; i < aLen; i++) {
        tmp2 = bCharCode === charCodeCache[i] ? tmp : tmp + 1;
        tmp = arr[i];
        ret = arr[i] =
          tmp > ret
            ? tmp2 > ret
              ? ret + 1
              : tmp2
            : tmp2 > tmp
              ? tmp + 1
              : tmp2;
      }
    }

    return ret;
  }

  function suggestion(unrecognized: string, allowedOptions: string[]): string {
    const suggestion = allowedOptions.find(
      option => leven(option, unrecognized) < 3
    );

    return suggestion ? `\n\nDid you mean ${suggestion}?` : "";
  }

  function padWithWhiteSpaces(str: string, length: number) {
    for (let i = str.length; i < length; i++) {
      str += " ";
    }
    return str;
  }

  function parameterLeftDocumentation(parameter: CliParameter): string {
    const formatType = (str: string) =>
      parameter.isOptional ? ` [${str}]` : ` <${str}>`;
    switch (parameter.type.kind) {
      case CliTypeKind.Boolean:
        return parameter.name;
      case CliTypeKind.String:
        return parameter.name + formatType("string");
      case CliTypeKind.Number:
        return parameter.name + formatType("number");
      case CliTypeKind.StringLiterals:
        return parameter.name + formatType(parameter.type.values.join("|"));
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
            `${
              parameter.name
            } does not accept the value "${value}". Allowed values: ${parameter.type.values.join(
              ", "
            )}${suggestion(value, parameter.type.values)}`
          );
        }
        return value;
      default:
        throw new Error(`Invalid argument type ${parameter.type.kind}`);
    }
  }

  function unknownOptionMessage(
    unrecognized: string,
    signature: CliSignature
  ): string {
    return (
      `Unknown option ${unrecognized}` +
      suggestion(unrecognized, signature.parameters.map(p => p.name))
    );
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

    throw new Error(unknownOptionMessage(arg, signature));
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
