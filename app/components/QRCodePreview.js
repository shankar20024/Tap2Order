"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Dancing_Script } from "next/font/google";
import { FaDownload } from "react-icons/fa";
import { Poppins } from "next/font/google";
const poppins = Poppins({ subsets: ["latin"], weight: "600" });


const dancingScript = Dancing_Script({ subsets: ['latin'] });

export default function QRCodePreview({ userId, tableNumber }) {
  const canvasRef = useRef(null);

  // Configurable sizes
  const displaySize = 100;
  const downloadSize = 500;

  const generateQRUrl = () => {
    return `${window.location.origin}/qr/${userId}/${tableNumber}`;
  };

  // Return Promise so we can await drawing
  const drawQRCode = (size, canvas, includeBackground = false, tableNumber = null) => {
    return new Promise(async (resolve) => {
      const ctx = canvas.getContext("2d");
      const url = generateQRUrl();
  
      try {
        const qrDataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: "H",
          width: size,
          margin: 1,
        });
  
        const qrImage = new Image();
        qrImage.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
  
          // Background (rounded)
          if (includeBackground) {
            ctx.fillStyle = "#fef3c7"; // light amber background
            ctx.beginPath();
            ctx.roundRect(0, 0, canvas.width, canvas.height, 30);
            ctx.fill();
          }
  
          // Draw QR at top
          const qrTop = 0;
          ctx.drawImage(qrImage, 0, qrTop, size, size);
  
          // Brand Text - Centered on QR
          const brand = "Tap2Orders";
          ctx.font = `bold ${Math.floor(size * 0.08)}px ${dancingScript.style.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const centerX = size / 2;
          const centerY = size / 2;
  
          ctx.fillStyle = "white";
          const textWidth = ctx.measureText(brand).width;
          const boxPadding = size * 0.03;
          ctx.fillRect(
            centerX - textWidth / 2 - boxPadding,
            centerY - size * 0.06,
            textWidth + boxPadding * 2,
            size * 0.12
          );
  
          ctx.fillStyle = "#92400e";
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.fillText(brand, centerX, centerY + 1);
  
          // Remove shadow
          ctx.shadowColor = 'transparent';
  
          // Table No. - below QR
          if (includeBackground && tableNumber) {
            ctx.font = `600 ${Math.floor(size * 0.065)}px ${poppins.style.fontFamily}`;
            ctx.fillStyle = "#d97706";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(`Table No: ${tableNumber}`, canvas.width / 2, size + 15);
          }          
  
          resolve();
        };
  
        qrImage.src = qrDataUrl;
      } catch (err) {
        resolve();
      }
    });
  };
  
  

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = displaySize;
      canvasRef.current.height = displaySize;
      drawQRCode(displaySize, canvasRef.current);
    }
  }, [userId, tableNumber]);

  const handleDownload = async () => {
    const width = downloadSize;
    const height = downloadSize + 60;
  
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
  
    await drawQRCode(width, tempCanvas, true, tableNumber);
  
    const link = document.createElement("a");
    link.download = `table-${tableNumber}-qr.jpeg`;
    link.href = tempCanvas.toDataURL("image/jpeg", 0.95);
    link.click();
  };
  
  

  return (
    <div className="p-4 flex flex-row items-center space-x-4">
      <canvas
        ref={canvasRef}
        className="border rounded shadow"
        width={displaySize}
        height={displaySize}
      />
      <button
        onClick={handleDownload}
        className="bg-amber-500 text-white px-4 py-2.5 rounded hover:bg-amber-600"
      >
        <FaDownload /> 
      </button>
    </div>
  );
}
