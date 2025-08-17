"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FaSave, FaArrowLeft } from "react-icons/fa";

export default function StaffEditPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const { id } = params || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "waiter",
    department: "service",
    isActive: true,
  });

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
        const s = data.staff || {};
        setForm({
          name: s.name || "",
          email: s.email || "",
          phone: s.phone || "",
          position: s.position || "waiter",
          department: s.department || "service",
          isActive: !!s.isActive,
        });
      } catch (e) {
        setError(e.message || "Error loading staff");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, id, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || `Save failed (${res.status})`);
      router.replace(`/staff-management/${id}`);
    } catch (e) {
      setError(e.message || "Error saving staff");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Staff</h1>
        <div className="space-x-2">
          <button onClick={() => router.back()} className="px-3 py-2 border rounded inline-flex items-center">
            <FaArrowLeft className="mr-2" /> Back
          </button>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input className="w-full border rounded px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Phone</label>
          <input className="w-full border rounded px-3 py-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Position</label>
          <select className="w-full border rounded px-3 py-2" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
            <option value="waiter">Waiter</option>
            <option value="chef">Chef</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="cleaner">Cleaner</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Department</label>
          <select className="w-full border rounded px-3 py-2" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            <option value="service">Service</option>
            <option value="kitchen">Kitchen</option>
            <option value="management">Management</option>
            <option value="cleaning">Cleaning</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <input id="active" type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          <label htmlFor="active" className="text-sm text-gray-700">Active</label>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-flex items-center disabled:opacity-50">
            <FaSave className="mr-2" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
