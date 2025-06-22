"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function QRCodePreview({ userId, tableNumber }) {
  const canvasRef = useRef(null);

  const generateQRUrl = () => {
    return `${window.location.origin}/qr/${userId}/${tableNumber}`;
  };

  const drawQRCodeWithBrand = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const url = generateQRUrl();

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      width: 200,
      margin: 2,
    });

    const qrImage = new Image();
    qrImage.src = qrDataUrl;

    qrImage.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw QR code
      ctx.drawImage(qrImage, 0, 0, 200, 200);

      // Draw brand name in center
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = "#000";
      const text = "Tap2Order";
      const textWidth = ctx.measureText(text).width;
      ctx.fillText(text, (canvas.width - textWidth) / 2, canvas.height - 10);
    };
  };

  useEffect(() => {
    drawQRCodeWithBrand();
  }, [userId, tableNumber]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `table-${tableNumber}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="p-4">
      <canvas ref={canvasRef} width={200} height={230} className="border rounded" />
      <button
        onClick={handleDownload}
        className="mt-2 bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
      >
        ⬇️ Download QR with Brand
      </button>
    </div>
  );
}
