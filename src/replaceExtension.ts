import * as path from "path";

export function replaceExtension(npath: string, ext: string): string {
  if (npath.length === 0) {
    return npath;
  }

  var nFileName = path.basename(npath, path.extname(npath)) + ext;
  return path.join(path.dirname(npath), nFileName);
}
