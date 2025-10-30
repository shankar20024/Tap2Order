"use client";
import React from 'react';
import { FaHeadset, FaExternalLinkAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function SupportSection() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Customer Support</h2>
        <p className="text-slate-600 mt-1">Manage customer support tickets and requests</p>
      </div>

      {/* Redirect Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <FaHeadset className="text-4xl" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Support Ticket System</h3>
            <p className="text-blue-100 mt-1">Access the full support management interface</p>
          </div>
        </div>
        
        <p className="text-blue-50 mb-6">
          The customer support system has its own dedicated interface with advanced features for managing tickets, 
          tracking issues, and communicating with hotel owners.
        </p>

        <button
          onClick={() => router.push('/customer-support')}
          className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 flex items-center gap-2 shadow-lg"
        >
          Open Support Center
          <FaExternalLinkAlt />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔴</span>
            </div>
            <span className="text-2xl font-bold text-slate-800">12</span>
          </div>
          <p className="text-slate-600 font-medium">Open Tickets</p>
          <p className="text-xs text-slate-500 mt-1">Requires attention</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🟡</span>
            </div>
            <span className="text-2xl font-bold text-slate-800">8</span>
          </div>
          <p className="text-slate-600 font-medium">In Progress</p>
          <p className="text-xs text-slate-500 mt-1">Being resolved</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🟢</span>
            </div>
            <span className="text-2xl font-bold text-slate-800">45</span>
          </div>
          <p className="text-slate-600 font-medium">Resolved</p>
          <p className="text-xs text-slate-500 mt-1">This month</p>
        </div>
      </div>
    </div>
  );
}
