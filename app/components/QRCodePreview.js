"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "react-hot-toast";

export default function QRCodePreview({ userId, tableNumber }) {
  const [isHovered, setIsHovered] = useState(false);

  const generateQRUrl = () => {
    return `${window.location.origin}/qr/${userId}/${tableNumber}`;
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `table-${tableNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleDownload}
      >
        <QRCode
          value={generateQRUrl()}
          size={40}
          level="H"
          style={{ width: '100%', height: '100%' }}
        />
        <span>Preview QR</span>
        {isHovered && (
          <div className="absolute right-0 top-0 bg-gray-800 text-white px-2 py-1 rounded text-sm">
            Click to download
          </div>
        )}
      </div>
    </div>
  );
}
