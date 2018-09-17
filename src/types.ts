export const enum CliType {
  Boolean,
  Number,
  String
}

export type CliParameter = {
  type: CliType;
  name: string;
  documentation: string | null;
};

export type CliSignature = {
  fileName: string;
  parameters: CliParameter[];
  documentation: string | null;
};
