"use client";
import { useState } from "react";
import { FaFilePdf, FaFileExcel, FaDownload, FaChevronDown } from "react-icons/fa";
import * as XLSX from "xlsx";




export default function DownloadButton({ orders, itemSales, dailyRevenue, monthlyRevenue }) {
  const [isOpen, setIsOpen] = useState(false);

  const exportToExcel = () => {
    // Prepare data for Excel
    const orderData = orders.map(order => ({
      "Order No": orders.indexOf(order) + 1,
      "Time": new Date(order.createdAt).toLocaleTimeString(),
      "Status": order.status,
      "Items": order.items.map(i => `${i.name} (x${i.quantity})`).join(", "),
      "Total": order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }));

    const itemData = Object.entries(itemSales).map(([item, data]) => ({
      "Item": item,
      "Quantity": data.quantity,
      "Revenue": data.revenue
    }));

    const summaryData = [{
      "Daily Revenue": dailyRevenue,
      "Monthly Revenue": monthlyRevenue,
      "Total Orders": orders.length
    }];

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(orderData), "Orders");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemData), "Item Sales");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Summary");

    // Download the file
    XLSX.writeFile(wb, `order_history_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsOpen(false);
  };

  
  

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex justify-center items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
      >
        <FaDownload />
        Download
        <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
            >
              <FaFileExcel className="text-green-600" />
              Export as Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
