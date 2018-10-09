export default function(x: string | undefined) {
  process.stdout.write(x === undefined ? "undefined" : x.toString());
}
