import * as Ably from "ably";

const ably = new Ably.Realtime({ key: process.env.NEXT_PUBLIC_ABLY_API_KEY });

export default ably;

// Provide a named getter for compatibility with pages importing { getAbly }
export function getAbly() {
  return ably;
}
