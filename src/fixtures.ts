import {
  CliType,
  CliParameter,
  CliTypeKind,
  StringLiterals,
  SimpleType
} from "./types";

export function cliParam(
  type: CliType,
  name: string,
  isOptional: boolean = false,
  documentation: string = null
): CliParameter {
  return {
    type,
    name,
    isOptional,
    documentation
  };
}

export function aSimpleType(
  kind: CliTypeKind.Boolean | CliTypeKind.Number | CliTypeKind.String
): SimpleType {
  return {
    kind
  };
}

export function aStringsLiterals(values: string[]): StringLiterals {
  return {
    kind: CliTypeKind.StringLiterals,
    values
  };
}
