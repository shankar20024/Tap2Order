"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FaArrowLeft, FaEdit, FaUser, FaCopy } from "react-icons/fa";
import Header from "@/app/components/Header";
import Sidebar from "@/app/components/Sidebar";

export default function StaffDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const { id } = params || {};

  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [error, setError] = useState("");

  const copyText = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      alert('Copied');
    } catch (e) {
      alert('Copy failed');
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status !== "authenticated" || !id) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/staff/${id}`);
        if (!res.ok) throw new Error(`Failed to load staff (${res.status})`);
        const data = await res.json();
        if (!data?.success) throw new Error(data?.error || "Failed to load staff");
        setStaff(data.staff);
      } catch (e) {
        setError(e.message || "Error loading staff");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, id, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <div className="fixed top-20 md:top-16 left-0 right-0 md:left-64 bottom-0 overflow-hidden">
          <div className="h-full overflow-auto p-6">Loading...</div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <div className="fixed top-20 md:top-16 left-0 right-0 md:left-64 bottom-0 overflow-hidden">
          <div className="h-full overflow-auto p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <button className="text-blue-600" onClick={() => router.back()}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }
  if (!staff) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <div className="fixed top-20 md:top-16 left-0 right-0 md:left-64 bottom-0 overflow-hidden">
        <div className="h-full overflow-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaUser className="text-gray-700" />
              <h1 className="text-xl font-semibold">Staff Details</h1>
            </div>
            <div className="space-x-2">
              <Link href={`/staff-management/${id}/edit`} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-flex items-center">
                <FaEdit className="mr-2" /> Edit
              </Link>
              <button onClick={() => router.back()} className="px-3 py-2 border rounded inline-flex items-center">
                <FaArrowLeft className="mr-2" /> Back
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="font-medium">{staff.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Employee ID</div>
              <div className="font-medium">{staff.employeeId}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Passcode</div>
              <div className="font-medium flex items-center space-x-2">
                <span className="font-mono">{staff.passcode || '—'}</span>
                {staff.passcode && (
                  <button
                    onClick={() => copyText(staff.passcode)}
                    className="text-gray-500 hover:text-gray-700"
                    title="Copy"
                  >
                    <FaCopy />
                  </button>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Position</div>
              <div className="font-medium">{staff.position}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Department</div>
              <div className="font-medium">{staff.department}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium">{staff.email || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-medium">{staff.phone || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Active</div>
              <div className="font-medium">{staff.isActive ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
