import * as Ably from "ably";

// Create different instances for server and client
let ably;

if (typeof window === 'undefined') {
  // Server-side: Use REST API only to avoid WebSocket issues
  ably = new Ably.Rest({ 
    key: process.env.NEXT_PUBLIC_ABLY_API_KEY,
    environment: 'production'
  });
} else {
  // Client-side: Use Realtime with WebSocket
  ably = new Ably.Realtime({ 
    key: process.env.NEXT_PUBLIC_ABLY_API_KEY,
    environment: 'production',
    autoConnect: true,
    disconnectedRetryTimeout: 15000,
    suspendedRetryTimeout: 30000
  });
}

export default ably;

// Provide a named getter for compatibility with pages importing { getAbly }
export function getAbly() {
  return ably;
}
