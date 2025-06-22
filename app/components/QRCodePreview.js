"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Dancing_Script } from "next/font/google";
import { FaDownload } from "react-icons/fa";

const dancingScript = Dancing_Script({ subsets: ['latin'] });

export default function QRCodePreview({ userId, tableNumber }) {
  const canvasRef = useRef(null);

  // Configurable sizes
  const displaySize = 100;
  const downloadSize = 300;

  const generateQRUrl = () => {
    return `${window.location.origin}/qr/${userId}/${tableNumber}`;
  };

  // Return Promise so we can await drawing
  const drawQRCode = (size, canvas) => {
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
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(qrImage, 0, 0, size, size);

          const brand = "Tap2Order";
          ctx.font = `bold ${Math.floor(size * 0.08)}px ${dancingScript.style.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const textWidth = ctx.measureText(brand).width;
          const boxPadding = size * 0.03;
          const centerX = size / 2;
          const centerY = size / 2;

          ctx.fillStyle = "white";
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

          ctx.shadowColor = 'transparent';
          resolve(); // ✅ Done drawing
        };

        qrImage.src = qrDataUrl;
      } catch (err) {
        console.error("QR generation failed", err);
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
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = downloadSize;
    tempCanvas.height = downloadSize;

    await drawQRCode(downloadSize, tempCanvas); // ✅ Wait for drawing
    const link = document.createElement("a");
    link.download = `table-${tableNumber}-qr.png`;
    link.href = tempCanvas.toDataURL("image/png");
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
