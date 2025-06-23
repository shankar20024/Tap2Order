import Link from "next/link";

export default function NavButton({ href, label, className = "" }) {
  return (
    <Link href={href}>
      <button
        className={`bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 
                    text-white px-5 py-2 rounded-lg shadow-md transition duration-200 ease-in-out 
                    text-sm md:text-base font-medium ${className}`}
      >
        {label}
      </button>
    </Link>
  );
}
