import * as Ably from "ably";

const ably = new Ably.Realtime({ key: process.env.NEXT_PUBLIC_ABLY_API_KEY });

export default ably;





