import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Table from "@/models/Table";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { tableNumber } = await req.json();
  await connectDB();

  // Check for duplicate table number for the same user
  const existing = await Table.findOne({
    tableNumber,
    userId: session.user.id,
  });

  if (existing) {
    return new Response(JSON.stringify({ error: "Table already exists" }), {
      status: 400,
    });
  }

  const newTable = await Table.create({
    tableNumber,
    userId: session.user.id,
    status: "free", // optional: default status
  });

  return Response.json(newTable);
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    // Get all parameters from URL
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const filter = url.searchParams.get('filter') || 'all';
    const search = url.searchParams.get('search') || '';

    await connectDB();

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Build query based on filter and search
    const query = { userId: session.user.id };
    if (filter !== 'all') {
      query.status = filter;
    }

    // If search is a number, use exact match
    // If search is not a number, use regex match
    if (search) {
      const num = parseInt(search);
      if (!isNaN(num)) {
        query.tableNumber = num;
      } else {
        query.tableNumber = { $regex: search, $options: 'i' };
      }
    }

    // Get total count for pagination
    const total = await Table.countDocuments(query);

    // Get counts of free and occupied tables for ALL tables of the user (not filtered)
    const counts = await Table.aggregate([
      { $match: { userId: session.user.id } }, // Only match tables for this user
      { $group: {
        _id: "$status",
        count: { $sum: 1 }
      }}
    ]);

    // Convert counts to object
    const countsObj = counts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Get paginated tables
    const tables = await Table.find(query)
      .sort({ tableNumber: 1 })
      .skip(skip)
      .limit(limit);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return Response.json({
      tables,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      },
      hasTables: total > 0,
      counts: {
        totalFreeTables: countsObj.free || 0,
        totalOccupiedTables: countsObj.occupied || 0,
        totalTables: total
      }
    });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      hasTables: false
    }), {
      status: 500,
    });
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { _id, userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID required" }), {
        status: 400,
      });
    }

    await connectDB();

    // First check if the table belongs to this user
    const table = await Table.findOne({ _id, userId });
    if (!table) {
      return new Response(JSON.stringify({ error: "Table not found or unauthorized" }), {
        status: 404,
      });
    }

    // Toggle status between free and occupied
    table.status = table.status === "free" ? "occupied" : "free";
    await table.save();

    return Response.json(table);
  } catch (error) {
    console.error("Error toggling table status:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
