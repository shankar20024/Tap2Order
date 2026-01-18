export async function GET() {
  return new Response(JSON.stringify({
    message: "Debug endpoint working",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    nextauth_secret: !!process.env.NEXTAUTH_SECRET,
    nextauth_url: process.env.NEXTAUTH_URL
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
