/**
 * Send ships to the specified destination
 *
 * @param destination the ships target
 * @param numberOfShip the number of ships to send
 * @param armed whether the ships are equipped with weapons or not
 */
export default function(
  destination: string,
  numberOfShip: number,
  armed: boolean
) {
  console.log(
    `You sent ${numberOfShip} ${armed ? "armed" : ""} ships to ${destination}`
  );
}
