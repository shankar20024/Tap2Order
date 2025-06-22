"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import RefreshButton from "../components/RefreshButton";

export default function TablePage() {
  const { data: session, status } = useSession();
  const [tableNumber, setTableNumber] = useState("");
  const [tables, setTables] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasTables, setHasTables] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTables();
    }
  }, [status, page, itemsPerPage, filter, searchTerm]);

  const fetchTables = async () => {
    try {
      const res = await fetch(
        `/api/table?page=${page}&limit=${itemsPerPage}&filter=${filter}&search=${encodeURIComponent(searchTerm)}`
      );
      const data = await res.json();
      
      // Set default values if data is undefined
      const pagination = data?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: itemsPerPage
      };

      setTables(data.tables || []);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.totalItems);
      setHasTables(data.hasTables || false);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Error loading tables");
      // Set default values on error
      setTables([]);
      setTotalPages(1);
      setTotalItems(0);
      setHasTables(false);
    }
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
      toast.success("Table added successfully!");
    } else {
      const error = await res.json();
      toast.error(`${error.error || "Failed to add table"}`);
    }
  };

  const deleteTable = async (id) => {
    if (!confirm("Are you sure you want to delete this table?")) return;

    try {
      const res = await fetch(`/api/table/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTables();
        toast.success("Table deleted");
      } else {
        toast.error("Failed to delete table");
      }
    } catch (error) {
      toast.error("Error deleting table");
    }
  };

  const toggleTableStatus = async (tableId) => {
    // Check if user is authenticated
    if (!session?.user?.id) {
      toast.error("Please log in to toggle table status");
      return;
    }

    try {
      const res = await fetch(`/api/table`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: tableId, userId: session.user.id }),
      });

      if (res.ok) {
        const updatedTable = await res.json();
        // Update the table status in the current state
        setTables(tables.map(table => 
          table._id === tableId ? updatedTable : table
        ));
        toast.success(`Table status updated to ${updatedTable.status}`);
      } else {
        const error = await res.json();
        toast.error(`${error.error || "Failed to update table status"}`);
      }
    } catch (error) {
      console.error("Error in toggleTableStatus:", error);
      toast.error("Error updating table status");
    }
  };

  const filteredTables = tables.filter(table => {
    if (filter === 'all') return true;
    if (filter === 'free') return table.status === 'free';
    if (filter === 'occupied') return table.status === 'occupied';
    return true;
  });

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setPage(1); // Reset to first page when changing items per page
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div className="p-8">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-4">Manage Tables</h1>

      <div className="mb-4 space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('free')}
          className={`px-4 py-2 rounded ${filter === 'free' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        >
          Free
        </button>
        <button
          onClick={() => setFilter('occupied')}
          className={`px-4 py-2 rounded ${filter === 'occupied' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
        >
          Occupied
        </button>
        <RefreshButton 
          onRefresh={fetchTables} 
          label="Refresh Tables"
          className="ml-auto"
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by table number..."
              value={searchTerm}
              onChange={handleSearch}
              className="border p-2 rounded pl-8 pr-2"
            />
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {!searchTerm && (
            <>
              <label className="text-sm">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border p-2 rounded"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
            </>
          )}
        </div>
        <div className="text-sm">
          Showing {tables.length} of {totalItems} tables
        </div>
      </div>

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

      {hasTables ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredTables.map((table) => (
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

              <div className="flex gap-2">
                {session?.user?.id && (
                  <button
                    onClick={() => toggleTableStatus(table._id)}
                    className={`px-4 py-2 rounded ${
                      table.status === "occupied"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                    } text-white transition-colors duration-200`}
                  >
                    {table.status === "occupied" ? "Mark Free" : "Mark Occupied"}
                  </button>
                )}
                <a
                  href={`/qr/${session.user.id}/${table.tableNumber}`}
                  target="_blank"
                  className="text-blue-600 underline text-sm"
                >
                  View QR Menu
                </a>
                <button
                  onClick={() => deleteTable(table._id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No tables found matching your search criteria.</p>
          <p className="text-sm text-gray-500 mt-2">
            Try a different search term or filter.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
