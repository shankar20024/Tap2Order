"use client";
import { useState } from "react";

export default function PasswordInput({
  value,
  onChange,
  placeholder = "",
  className = "",
  id,
  name,
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete || "new-password"}
        className="w-full px-5 py-3 rounded-lg border border-amber-300 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition text-amber-900"
        style={{ 
          // Disable Microsoft Edge password reveal button
          // Applies only in Edge, others ignore it
          msRevealButton: "none",
        }}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-700 hover:text-amber-900 transition focus:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {showPassword ? (
          // eye closed icon SVG
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.956 9.956 0 012.069-6.179M3 3l18 18"
            />
          </svg>
        ) : (
          // eye open icon SVG
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        )}
      </button>
      <style jsx>{`
        /* hide Edge show password button */
        input::-ms-reveal {
          display: none;
        }
      `}</style>
    </div>
  );
}
