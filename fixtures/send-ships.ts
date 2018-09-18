// send-ships.ts

/**
 * Send ships to the specified destination
 *
 * @param destination the ships destination
 * @param numberOfShips the number of ships to send
 * @param armed whether the ships are equipped with weapons or not
 */
export default function(
  destination: string,
  numberOfShips: number,
  armed: boolean
) {
  console.log(
    `You sent ${numberOfShips} ${armed ? "armed" : ""} ships to ${destination}`
  );
}
