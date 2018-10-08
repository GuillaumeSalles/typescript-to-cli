export const enum CliTypeKind {
  Boolean,
  Number,
  String,
  StringLiterals
}

export type CliType = SimpleType | StringLiterals;

export type SimpleType = {
  kind: CliTypeKind.Boolean | CliTypeKind.Number | CliTypeKind.String;
};

export interface StringLiterals {
  kind: CliTypeKind.StringLiterals;
  values: string[];
}

export type StringsLiteral = {
  values: string[];
};

export type CliParameter = {
  type: CliType;
  name: string;
  documentation: string | null;
  isOptional: boolean;
};

export type CliSignature = {
  fileName: string;
  parameters: CliParameter[];
  documentation: string | null;
};
