"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function TablePage() {
  const { data: session, status } = useSession();
  const [tableNumber, setTableNumber] = useState("");
  const [tables, setTables] = useState([]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTables();
    }
  }, [status]);

  const fetchTables = async () => {
    const res = await fetch("/api/table");
    const data = await res.json();
    setTables(data);
  };

  const createTable = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/table", {
      method: "POST",
      body: JSON.stringify({ tableNumber }),
    });

    if (res.ok) {
      setTableNumber("");
      fetchTables();
    }
  };

  const deleteTable = async (id) => {
  if (!confirm("Are you sure you want to delete this table?")) return;

  try {
    const res = await fetch(`/api/table/${id}`, { method: "DELETE" });
    if (res.ok) {
      // Refresh table list
      fetchTables();
    } else {
      alert("Failed to delete table");
    }
  } catch (error) {
    alert("Error deleting table");
  }
};


  if (status === "loading") return <p>Loading...</p>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Manage Tables</h1>

      <form onSubmit={createTable} className="mb-6 space-x-2">
        <input
          type="number"
          placeholder="Enter Table Number"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-amber-500 text-white px-4 py-2 rounded"
        >
          ➕ Add Table
        </button>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {tables.map((table) => (
          <div
            key={table._id}
            className="border p-4 rounded bg-white shadow flex justify-between items-center"
          >
            <div>
              <strong className="text-lg">Table #{table.tableNumber}</strong>
              <p
                className={`text-sm font-semibold ${
                  table.status === "occupied"
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {table.status === "occupied" ? "Occupied" : "Free"}
              </p>
            </div>

            {session?.user?.id && (
              <a
                href={`/qr/${session.user.id}/${table.tableNumber}`}
                target="_blank"
                className="text-blue-600 underline text-sm"
              >
                View QR Menu
              </a>
            )}
            <button
        onClick={() => deleteTable(table._id)}
        className="text-red-600 hover:underline text-sm"
      >
        Delete
      </button>
          </div>
        ))}
      </div>
    </div>
  );
}
