"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaBars, FaClipboardList, FaHistory, FaListAlt } from "react-icons/fa";
import Logo from "./Logo";
import NavButton from "./NavButton";
import Logout from "./Logout";
import GlobalSearch from "./GlobalSearch";

export default function Header({ className = "", className2 = "" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const isDashboard = pathname === "/dashboard";

  useEffect(() => {
    if (status === "authenticated") {
      setUsername(session.user.name || "");
    }
  }, [status, session]);

  return (
    <div className="sticky top-0 z-50 w-full">
      <header
        className={`fixed w-full left-1/2 transform -translate-x-1/2 top-0 px-4 sm:px-6 py-3 sm:py-4 bg-white shadow-md rounded-b-lg ${className2}`}
      >
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 ${className}`}>

          {/* Desktop: Logo | Nav | Username */}
          <div className="hidden sm:flex w-full items-center justify-between">
            {/* Left: Logo */}
            <div className="flex justify-start">
              <Logo
                className="text-3xl sm:text-4xl cursor-pointer"
                onClick={() => router.push("/dashboard")}
              />
            </div>
            <GlobalSearch />

            

            {/* Right: Username */}
            <div className="flex justify-end">
              <p className="text-gray-700 text-sm font-medium tracking-wide text-right">
                Logged in as{" "}
                <span className="font-semibold text-amber-700">{username}</span>
              </p>
            </div>
          </div>

          {/* Mobile: Logo */}
          <div className="w-full flex sm:hidden items-center justify-between">
            <div className="flex-1 flex justify-center">
              <Logo
                className="text-3xl sm:text-4xl cursor-pointer"
                onClick={() => router.push("/dashboard")}
              />
            </div>
          </div>

          {/* Mobile: Username */}
          <p className="sm:hidden text-gray-700 text-xs font-medium tracking-wide text-center">
            Logged in as{" "}
            <span className="font-semibold text-amber-700">{username}</span>
          </p>
        </div>
      </header>
    </div>
  );
}
