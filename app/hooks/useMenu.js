"use client";

import { useState, useEffect } from "react";

export default function useMenu(userId) {
  const [menu, setMenu] = useState([]);
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch menu from API
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/menu?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMenu(data);

        const uniqueCategories = Array.from(
          new Set(data.map(item => item.category || "Uncategorized"))
        ).filter(category => category !== "none"); // Filter out "none" category
        
        // Add Jain to categories only if there are Jain items in the menu
        const hasJainItems = data.some(item => item.category === 'jain');
        const finalCategories = hasJainItems ? [...uniqueCategories] : uniqueCategories.filter(cat => cat !== 'jain');
        
        setCategories(finalCategories);
        setActiveCategory('All');
        setFilteredMenu(data);
      } else {
        // Failed to fetch menu
      }
    } catch (err) {
      // Menu fetch error
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchMenu();
    }
  }, [userId]);

  // Filter menu based on category and search term
  useEffect(() => {
    let filtered = menu.filter(item => item.available);
    
    if (activeCategory && activeCategory !== 'All') {
      filtered = filtered.filter(item => 
        (item.category || "Uncategorized") === activeCategory
      );
    }
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredMenu(filtered);
  }, [menu, activeCategory, searchTerm]);

  // Helper function to get display price from menu item
  const getDisplayPrice = (item) => {
    if (item.price && typeof item.price === 'number') {
      return item.price;
    }
    
    if (item.pricing && Array.isArray(item.pricing) && item.pricing.length > 0) {
      return item.pricing[0].price;
    }
    
    return 0;
  };

  // Helper function to get price for selected size
  const getPriceForSize = (item, sizeIndex = 0) => {
    if (item.pricing && Array.isArray(item.pricing) && item.pricing.length > 0) {
      return item.pricing[sizeIndex]?.price || item.pricing[0].price;
    }
    return item.price || 0;
  };

  // Helper function to check if item has multiple sizes
  const hasMultipleSizes = (item) => {
    return item.pricing && Array.isArray(item.pricing) && item.pricing.length > 1;
  };

  return {
    menu,
    filteredMenu,
    categories,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    loading,
    fetchMenu,
    getDisplayPrice,
    getPriceForSize,
    hasMultipleSizes
  };
}
