"use client";

import { useState, useEffect } from "react";

export default function SectionSidebar({ 
  sections = [], 
  activeSection, 
  setActiveSection,
  orderPlaced,
  filteredMenu = []
}) {
  const [itemCounts, setItemCounts] = useState({});

  // Calculate item counts for each section
  useEffect(() => {
    const counts = {};
    counts['All'] = filteredMenu.length;
    
    sections.forEach(section => {
      counts[section.name] = filteredMenu.filter(item => 
        item.section === section.name
      ).length;
    });
    
    setItemCounts(counts);
  }, [sections, filteredMenu]);

  const allSections = [{ name: 'All', icon: '🍽️', color: '#f59e0b' }, ...sections];

  return (
    <div className="w-2/6 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Our Menu</h2>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-2">
        {allSections.map((section, index) => {
          const isActive = activeSection === section.name;
          const count = itemCounts[section.name] || 0;
          
          return (
            <>
            {count > 0 && <div>
            <button
              key={section.name}
              onClick={() => setActiveSection(section.name)}
              disabled={orderPlaced}
              className={`w-full p-3 rounded-lg text-left transition-all duration-200 mb-1
                         hover:shadow-sm ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              {count > 0 && <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {section.icon || '🍽️'}
                  </span>
                  <div>
                    <div className={`font-medium text-xs ${
                      isActive ? 'text-white' : 'text-gray-800'
                    }`}>
                      {section.name}
                    </div>
                  </div>
                </div>
              </div> }
            </button>
            </div>}
            </>
          );
        })}
      </div>
    </div>
  );
}
