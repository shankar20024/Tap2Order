"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import RefreshButton from "../components/RefreshButton";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import QRCodePreview from "../components/QRCodePreview";
import { motion } from "framer-motion";
import { FaChevronDown, FaTable, FaSearch, FaDownload } from "react-icons/fa";
import Header from "@/app/components/Header";
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';
import { Poppins, Dancing_Script } from 'next/font/google';

// Initialize fonts at the top level for reliability
const poppins = Poppins({ subsets: ['latin'], weight: '600' });
const dancingScript = Dancing_Script({ subsets: ['latin'] });

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [analysisData, setAnalysisData] = useState({
    totalTables: 0,
    freeTables: 0,
    occupiedTables: 0
  });

  // Debounced search effect: fetch from backend when searchTerm changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTables(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, page, itemsPerPage, filter]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAnalysisData();
      fetchTables(searchTerm);
    }
  }, [status]);

  const fetchAnalysisData = async () => {
    try {
      const res = await fetch('/api/table/analysis');
      if (!res.ok) throw new Error("Failed to fetch analysis");
      const data = await res.json();
      setAnalysisData(data);
    } catch (error) {
      toast.error("Error loading table analysis");
      setAnalysisData({
        totalTables: 0,
        freeTables: 0,
        occupiedTables: 0
      });
    }
  };
  

  const fetchTables = async (searchValue = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/table?page=${page}&limit=${itemsPerPage}&filter=${filter}&search=${encodeURIComponent(searchValue)}`);
      if (!res.ok) throw new Error("Failed to fetch tables");
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
    
    if (!tableNumber) {
      toast.error("Please enter a table number");
      return;
    }

    try {
      const res = await fetch("/api/table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tableNumber }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add table");
      }

      setTableNumber("");
      await Promise.all([fetchTables(), fetchAnalysisData()]);
      toast.success("Table added successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to add table");
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

      if (!res.ok) {
        const error = await res.json();
        toast.error(`${error.error || "Failed to update table status"}`);
      } else {
        const updatedTable = await res.json();
        setTables(tables.map(table =>
          table._id === tableId ? updatedTable : table
        ));
        // Refresh analysis data after status change
        fetchAnalysisData();
        toast.success(`Table status updated to ${updatedTable.status}`);
      }
    } catch (error) {
      toast.error("Error updating table status");
    }
  };


  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // fetchTables(e.target.value); // Debounced by useEffect
  };

  const handleRefresh = () => {
    fetchTables();
    fetchAnalysisData();
  };

  const downloadAllQRCodes = async () => {
    if (!tables || tables.length === 0) {
      toast.error('No tables available to download.');
      return;
    }

    setIsDownloading(true);
    const toastId = toast.loading('Preparing all QR codes... Please wait.');

    try {
      // Ensure fonts are loaded and ready before generating QR codes
      await document.fonts.ready;

      const zip = new JSZip();
      const size = 500;

      for (const table of tables) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size + 80; // Adjusted height for footer
        const ctx = canvas.getContext('2d');

        const url = `${window.location.origin}/qr/${session.user.id}/${table.tableNumber}`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: 'H',
          width: size,
          margin: 1,
        });

        const qrImage = new Image();
        await new Promise((resolve, reject) => {
          qrImage.onload = () => {
            try {
              // Draw background
              ctx.fillStyle = '#fef3c7'; // light amber background
              ctx.beginPath();
              ctx.roundRect(0, 0, canvas.width, canvas.height, 30);
              ctx.fill();

              // Draw QR code image
              ctx.drawImage(qrImage, 0, 0, size, size);

              // Brand Text
              const brand = "Tap2Orders";
              ctx.font = `bold ${Math.floor(size * 0.08)}px ${dancingScript.style.fontFamily}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const centerX = size / 2;
              const centerY = size / 2;

              const textWidth = ctx.measureText(brand).width;
              const boxPadding = size * 0.03;
              ctx.fillStyle = "white";
              ctx.fillRect(centerX - textWidth / 2 - boxPadding, centerY - size * 0.06, textWidth + boxPadding * 2, size * 0.12);

              ctx.fillStyle = "#92400e";
              ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
              ctx.shadowBlur = 6;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;
              ctx.fillText(brand, centerX, centerY + 1);
              ctx.shadowColor = 'transparent';

              // Table Number Text
              ctx.font = `600 ${Math.floor(size * 0.065)}px ${poppins.style.fontFamily}`;
              ctx.fillStyle = "#d97706";
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillText(`Table No: ${table.tableNumber}`, canvas.width / 2, size + 15);

              // "Scan to Order" text - smaller and centered
              ctx.font = `400 ${Math.floor(size * 0.045)}px ${poppins.style.fontFamily}`;
              ctx.fillStyle = "#a16207"; // Darker amber for readability
              ctx.fillText('Scan to Order', canvas.width / 2, size + 55);

              resolve();
            } catch (e) {
              reject(e);
            }
          };
          qrImage.onerror = (err) => reject(new Error('Failed to load QR image.'));
          qrImage.src = qrDataUrl;
        });

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        zip.file(`Table-${table.tableNumber}.png`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `All-Table-QRs-${new Date().toISOString().slice(0, 10)}.zip`);
      toast.success('All QR codes have been downloaded!', { id: toastId });

    } catch (error) {
            toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  if (status === "loading") return (
    <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50 overflow-hidden">
      <LoadingSpinner size="40" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 ">
      <Header className="w-full" className2="bg-white shadow-md" />
      <main className="container mx-auto px-4 py-8 mt-18">
        <Toaster position="top-right" />

        <h1 className="text-4xl font-bold text-amber-700 mb-6 flex items-center justify-center  gap-2 text-center md:hidden">
          <FaTable className="text-amber-700" />
          Manage Tables
        </h1>
        <div className="flex items-center justify-center mx-4 md:hidden ">
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

          {/* Mobile Add Table Input */}
          <form onSubmit={createTable} className=" flex flex-wrap md:hidden justify-center space-x-2">
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
        </div>
        {/* Search and Items per page for desktop with hidden mobile */}
        <div className="md:flex flex-col md:flex-row md:items-center md:justify-between mt-10 space-y-6 md:space-y-0 md:space-x-6 px-4 hidden">
          {/* Search Input */}
          <div className="w-full md:w-1/3">
            <div className="flex items-center border rounded-lg h-10 w-full">
              <div className="pl-3 text-gray-400">
                <FaSearch />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="flex-grow p-2 pr-3 text-sm focus:outline-none rounded-r-lg h-full"
              />
            </div>
          </div>


          {/* Heading */}
          <div className="w-full md:w-1/3 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-700 flex items-center justify-center gap-2">
              <FaTable className="text-amber-700" />
              Manage Tables
            </h1>
          </div>

          {/* Add Table Form */}
          <form
            onSubmit={createTable}
            className="w-full md:w-1/3 flex flex-col sm:flex-row items-center justify-center gap-2"
          >
            <input
              type="number"
              placeholder="Table No."
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="border p-2 rounded-lg text-sm w-full sm:w-auto flex-grow"
            />
            <button
              type="submit"
              className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm w-full sm:w-auto"
            >
              ➕ Add
            </button>
          </form>
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

        <div className="text-sm flex items-center space-x-4 justify-between mb-1 mx-2 ">
          <p className="text-sm">Tables {tables.length} / {totalItems}</p>
          {/* Unified Dropdown */}
          <div className="relative inline-block">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="border border-gray-300 px-3 py-2 rounded-lg text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <span className="flex items-center justify-between w-full">
                {itemsPerPage}
                <FaChevronDown className="ml-2" />
              </span>
            </button>
            {showDropdown && (
              <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-full">
                {[5, 10, 15, 20].map((value) => (
                  <li
                    key={value}
                    onClick={() => {
                      handleItemsPerPageChange({ target: { value: value.toString() } });
                      setShowDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-amber-100 cursor-pointer text-sm transition-colors duration-200"
                  >
                    {value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mb-4 border-t border-gray-200 pt-4">
          <button
            onClick={downloadAllQRCodes}
            disabled={isDownloading || !tables.length}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg shadow-md hover:bg-amber-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FaDownload />
                <span>Download All QR Codes</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Table Container */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {hasTables ? (
            <div className="grid md:grid-cols-2 gap-4">
              {tables.map((table) => (
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
