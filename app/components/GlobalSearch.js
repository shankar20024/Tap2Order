"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiX } from 'react-icons/fi';

const searchItems = [
  { 
    title: 'Inventory Dashboard', 
    path: '/inventory',
    category: 'Inventory'
  },
  { 
    title: 'Add Inventory Item', 
    path: '/inventory/add',
    category: 'Inventory'
  },
  { 
    title: 'View Stock', 
    path: '/inventory/stock',
    category: 'Inventory'
  },
  { 
    title: 'Manage Suppliers', 
    path: '/inventory/suppliers',
    category: 'Inventory'
  },
  { 
    title: 'Manage Menu', 
    path: '/menu',
    category: 'Menu'
  },
  { 
    title: 'Manage Table', 
    path: '/table',
    category: 'Table'
  },
  { 
    title: 'Order History', 
    path: '/order-history',
    category: 'Order History'
  }
];

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const searchRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const filtered = searchItems.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query]);

  const handleItemClick = (path) => {
    window.open(path, '_blank');
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <FiX className="h-4 w-4 text-gray-400 hover:text-gray-500" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto max-h-64">
          {results.map((item, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              onClick={() => handleItemClick(item.path)}
            >
              <div>
                <div className="font-medium text-gray-900">{item.title}</div>
                <div className="text-xs text-gray-500">{item.category}</div>
              </div>
              <span className="text-xs text-gray-500">New tab</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
