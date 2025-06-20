"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Logo from "./Logo";

export default function Header({ className = "" , className2 = ""}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      setUsername(session.user.name || "");
    }
  }, [status, session]);

  return (
    <div className="sticky top-0 z-50 w-full ">
      <header className={`fixed w-full left-1/2 transform -translate-x-1/2 top-0 px-4 sm:px-6 py-3 sm:py-4 bg-white shadow-md rounded-b-lg ${className2}`}>
        <div className={`flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-4 ${className}`}>
          <div className="w-full sm:w-auto flex justify-center sm:justify-start">
            <Logo
              className="text-3xl sm:text-4xl cursor-pointer"
              onClick={() => router.push("/dashboard")}
            />
          </div>
          <p className="text-gray-700 text-xs sm:text-sm font-medium tracking-wide text-center sm:text-left">
            Logged in as <span className="font-semibold text-amber-700">{username}</span>
          </p>
        </div>
      </header>
    </div>
  );
}
