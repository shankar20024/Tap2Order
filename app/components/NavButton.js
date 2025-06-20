import Link from "next/link";

export default function NavButton({ href, label, className = "" }) {
  return (
    <Link href={href}>
      <button className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow ${className}`}>
        {label}
      </button>
    </Link>
  );
}
