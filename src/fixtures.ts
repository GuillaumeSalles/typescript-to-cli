import { CliType, CliParameter } from "./types";

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
