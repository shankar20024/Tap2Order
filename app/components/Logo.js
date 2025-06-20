"use client";
import { Dancing_Script } from "next/font/google";


const dancingScript = Dancing_Script({
  weight: ["400", "700"], // you can change this
  subsets: ["latin"],
  display: "swap",
});

export default function Logo({ className = "" , onClick }) {
  return (
    <div className="cursor-pointer" onClick={onClick}>
    <h1
      className={`${dancingScript.className}   font-bold text-amber-800 drop-shadow-lg select-none ${className}`}
    >
      Tap2Order
    </h1>
    </div>
  );
}
