import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    // Create a URL object from the request
    const url = new URL(req.url);

    // Check if the request is for the public name endpoint
    if (url.pathname === "/api/me") {
      return new Response(
        JSON.stringify({
          name: session?.user?.name ?? null, // Return null if not authenticated
        }),
        { status: 200 }
      );
    }

    // If the path does not match, return a 404 response
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
