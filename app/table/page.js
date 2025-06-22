"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import RefreshButton from "../components/RefreshButton";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import QRCodePreview from "../components/QRCodePreview";
import { motion } from "framer-motion";
import { FaChevronDown, FaTable, FaSearch } from "react-icons/fa";
import Header from "@/app/components/Header";

export default function TablePage() {
  const { data: session, status } = useSession();
  const [tableNumber, setTableNumber] = useState("");
  const [tables, setTables] = useState([]);
  const [originalTables, setOriginalTables] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasTables, setHasTables] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [analysisData, setAnalysisData] = useState({
    totalTables: 0,
    freeTables: 0,
    occupiedTables: 0
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      // setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAnalysisData();
      fetchTables();
    }
  }, [status]);

  const fetchAnalysisData = async () => {
    try {
      const res = await fetch('/api/table/analysis');
      const data = await res.json();
      setAnalysisData(data);
    } catch (error) {
      console.error("Error fetching analysis data:", error);
      toast.error("Error loading table analysis");
      setAnalysisData({
        totalTables: 0,
        freeTables: 0,
        occupiedTables: 0
      });
    }
  };

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/table?page=${page}&limit=${itemsPerPage}&filter=${filter}`);
      const data = await res.json();

      const pagination = data?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: itemsPerPage
      };

      setOriginalTables(data.tables || []);
      setTables(data.tables || []);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.totalItems);
      setHasTables(data.hasTables || false);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Error loading tables");
      setOriginalTables([]);
      setTables([]);
      setTotalPages(1);
      setTotalItems(0);
      setHasTables(false);
    } finally {
      setLoading(false);
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
        // Refresh both tables and analysis data after deletion
        fetchTables();
        fetchAnalysisData();
        toast.success("Table deleted");
      } else {
        toast.error("Failed to delete table");
      }
    } catch (error) {
      toast.error("Error deleting table");
    }
  };

  const toggleTableStatus = async (tableId) => {
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
        body: JSON.stringify({ _id: tableId, userId: session.user.id })
      });

      if (res.ok) {
        const updatedTable = await res.json();
        setTables(tables.map(table =>
          table._id === tableId ? updatedTable : table
        ));
        // Refresh analysis data after status change
        fetchAnalysisData();
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
    setPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    const filteredTables = originalTables.filter(table =>
      table.tableNumber.toString().includes(e.target.value)
    );
    setTables(filteredTables);
  };

  const handleRefresh = () => {
    fetchTables();
    fetchAnalysisData();
  };

  if (status === "loading") return (
    <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50 overflow-hidden">
      <LoadingSpinner size="40" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header className="w-full" className2="bg-white shadow-md" />
      <main className="container mx-auto px-4 py-8 mt-16">
        <Toaster position="top-right" />


        <h1 className="text-4xl font-bold text-amber-700 mb-6 flex items-center justify-center  gap-2 text-center md:hidden">
          <FaTable className="text-amber-700" />
          Manage Tables
        </h1>

        {/* Mobile Add Table Input */}
        <form onSubmit={createTable} className="mb-6 flex flex-wrap md:hidden justify-center space-x-2">
          <input
            type="number"
            placeholder="Table No."
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="border p-2 rounded-lg flex-grow max-w-24 text-sm"
          />
          <button
            type="submit"
            className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm"
          >
            ➕ Add
          </button>
        </form>

        {/* Search and Items per page for desktop with hidden mobile */}
        <div className="md:flex hidden flex-wrap items-center justify-start md:mb-1 mt-16">
          <div className="flex items-center mb-4">
            <div className="flex space-x-86 justify-center">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="border p-2 rounded-lg pl-10 pr-2 text-sm md:max-w-64"
                />
                <div className="absolute left-3 top-1/2 transform md:-translate-y-2/2 -translate-y-1/2 text-gray-400">
                  <FaSearch />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-amber-700 mb-6 flex items-center justify-center  gap-2 ">
                  <FaTable className="text-amber-700" />
                  Manage Tables
                </h1>

              </div>
              {/* desktop Add Table Input */}
              <form onSubmit={createTable} className="mb-4 md:flex hidden flex-wrap justify-center space-x-2">
                <input
                  type="number"
                  placeholder="Table No."
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="border p-2 rounded-lg flex-grow max-w-xs text-sm"
                />
                <button
                  type="submit"
                  className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  ➕ Add
                </button>
              </form>
            </div>
          </div>
        </div>
        {/* Table Status Summary */}
        <div className="mt-6 space-y-6 md:mb-6">
          <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6 w-full mx-auto sm:scale-100 scale-[0.95] md:transform-none transform origin-top">
            <h2 className="text-3xl font-semibold text-amber-800 mb-4">Table Status</h2>
            <div className="flex flex-wrap sm:flex-nowrap gap-4">
              <div className="flex-1 bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <div className="text-sm text-gray-500">Total Tables</div>
                <div className="text-2xl font-bold text-blue-600">
                  {analysisData.totalTables}
                </div>
              </div>
              <div className="flex-1 bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <div className="text-sm text-gray-500">Free Tables</div>
                <div className="text-2xl font-bold text-green-600">
                  {analysisData.freeTables}
                </div>
              </div>
              <div className="flex-1 bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                <div className="text-sm text-gray-500">Occupied Tables</div>
                <div className="text-2xl font-bold text-red-600">
                  {analysisData.occupiedTables}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-4 flex flex-wrap justify-between space-x-2 mr-5">
          <div className="flex flex-wrap justify-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 text-sm rounded-lg ${filter === 'all' ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('free')}
              className={`px-3 py-2 text-sm rounded-lg ${filter === 'free' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              Free
            </button>
            <button
              onClick={() => setFilter('occupied')}
              className={`px-3 py-2 text-sm rounded-lg ${filter === 'occupied' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            >
              Occupied
            </button>
          </div>

          <RefreshButton
            onRefresh={handleRefresh}
            label="Refresh Tables"
            className="text-sm hidden md:flex"
            className2="hidden md:flex"
          />

          <RefreshButton
            onRefresh={fetchTables}
            label=""
            className="text-sm md:hidden"
            className2="hidden"
          />
        </div>

        <div className="text-sm flex items-center space-x-2 justify-between md:justify-end mb-3 mr-6 ">
          <p className="text-sm hidden md:block">Tables {tables.length} / {totalItems}</p>
          {/* Desktop Dropdown */}
          <div className="md:flex items-center space-x-2 hidden">
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border p-2 rounded-lg text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </div>
        </div>

        {/* Mobile Search and Items per page */}
        <div className="text-sm flex items-center space-x-2 justify-between md:hidden mb-2">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder=""
              value={searchTerm}
              onChange={handleSearch}
              className="border p-2 rounded-lg pl-10 pr-2 text-sm max-w-20"
            />
            <div className="absolute left-3 top-1/2 transform w-8 h-8 -translate-y-1/4 text-gray-400">
              <FaSearch />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-xs md:hidden">Tables {tables.length} / {totalItems}</p>
            {/* Mobile Dropdown */}
            <div className="relative inline-block w-full sm:w-32">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="border border-amber-500 px-3 py-2 rounded-lg text-sm w-full text-left"
              >
                <span className="flex items-center justify-center space-x-2">{itemsPerPage} <span className="ml-2"><FaChevronDown /></span></span>
              </button>
              {showDropdown && (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded mt-1 w-full shadow-md">
                  {[5, 10, 15, 20].map((value) => (
                    <li
                      key={value}
                      onClick={() => {
                        handleItemsPerPageChange({ target: { value } });
                        setShowDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-amber-100 cursor-pointer text-sm"
                    >
                      {value}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {hasTables ? (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredTables.map((table) => (
                //table card
                <motion.div
                  key={table._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="border border-gray-200 p-4 sm:p-6 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6">
                    {/* Table Info */}
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                        Table #{table.tableNumber}
                      </h3>
                      <p
                        className={`text-sm font-medium ${table.status === "occupied" ? "text-red-600" : "text-green-600"}`}
                      >
                        {table.status === "occupied" ? "Occupied" : "Free"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last Updated: {" "}
                        {new Date(table.updatedAt).toLocaleString("en-IN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).replace(",", "")}
                      </p>
                    </div>

                    {/* Buttons and QR Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                      {/* QR Code in Center */}
                      <div className="w-full sm:w-auto flex justify-center">
                        <QRCodePreview userId={session.user.id} tableNumber={table.tableNumber} />
                      </div>

                      {/* Toggle + Delete Buttons Below Each Other */}
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        {session?.user?.id && (
                          <button
                            onClick={() => toggleTableStatus(table._id)}
                            className={`min-w-[120px] h-10 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-300 ${table.status === "occupied"
                              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                              : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 h-14"
                              }`}
                          >
                            {table.status === "occupied" ? "Mark Free" : "Mark Occupied"}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this table?")) {
                              deleteTable(table._id);
                            }
                          }}
                          className="min-w-[120px] h-10 px-4 py-2 rounded-lg bg-red-100 text-red-600 text-sm font-medium hover:bg-red-200 hover:text-red-700 transition-all duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No tables found matching your search criteria.</p>
              <p className="text-sm text-gray-500 mt-2">Try a different search term or filter.</p>
            </div>
          )}
        </div>

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
              <span className="px-4 py-2">Page {page} of {totalPages}</span>
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
      </main>
    </div>
  );
}
