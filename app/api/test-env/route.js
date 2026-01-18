export async function GET() {
  return new Response(JSON.stringify({
    environment: process.env.NODE_ENV,
    db_user: !!process.env.DB_USER,
    db_pass: !!process.env.DB_PASS,
    db_cluster: process.env.DB_CLUSTER,
    db_name: process.env.DB_NAME,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
