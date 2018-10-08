export default function(x: number | undefined) {
  process.stdout.write(x === undefined ? "undefined" : x.toString());
}
