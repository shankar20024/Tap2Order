"use client";
import { useState, useEffect, useRef } from "react";
import { FaPlus, FaSearch, FaTimes, FaEdit, FaTrash, FaUtensils, FaChartLine, FaEye, FaClock, FaChevronDown, FaCheck } from "react-icons/fa";
import { MdOutlineRestaurantMenu, MdTrendingUp, MdInventory } from "react-icons/md";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "veg",
    available: true,
    unit: "piece",
    subcategory: "",
    section: "",
    spicyLevel: "",
    preparationTime: "",
    pricing: [{ size: "", price: "", description: "" }],
    useSinglePrice: true,
    singlePrice: "",
  });
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const [isFixed, setIsFixed] = useState(false);
  const router = useRouter();
  
  // Section management states
  const [sections, setSections] = useState([]);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const [sectionSearchTerm, setSectionSearchTerm] = useState('');
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [customSizes, setCustomSizes] = useState({}); // Track custom sizes for each pricing option
  const sectionDropdownRef = useRef(null);

  // Helper functions for pricing management
  const addPricingOption = () => {
    setForm(prev => ({
      ...prev,
      pricing: [...prev.pricing, { size: "", price: "", description: "" }]
    }));
  };

  const removePricingOption = (index) => {
    setForm(prev => ({
      ...prev,
      pricing: prev.pricing.filter((_, i) => i !== index)
    }));
  };

  const updatePricingOption = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      pricing: prev.pricing.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Handle custom size input
  const handleCustomSizeChange = (index, customValue) => {
    setCustomSizes(prev => ({
      ...prev,
      [index]: customValue
    }));
    
    // Update the actual form with custom size
    updatePricingOption(index, 'size', customValue);
  };

  // Handle size selection (including custom)
  const handleSizeSelection = (index, selectedSize) => {
    if (selectedSize === 'custom') {
      // Don't update form yet, wait for custom input
      setCustomSizes(prev => ({
        ...prev,
        [index]: ''
      }));
    } else {
      // Clear custom size and update form with selected size
      setCustomSizes(prev => {
        const newCustomSizes = { ...prev };
        delete newCustomSizes[index];
        return newCustomSizes;
      });
      updatePricingOption(index, 'size', selectedSize);
    }
  };

  // Get size options based on unit (including custom option)
  const getSizeOptions = (unit) => {
    let baseOptions;
    switch (unit) {
      case "liter":
        baseOptions = ["0.5L", "1L", "2L"];
        break;
      case "ml":
        baseOptions = ["250ml", "500ml", "750ml", "1000ml"];
        break;
      case "plate":
      case "bowl":
      case "serving":
        baseOptions = ["half", "full"];
        break;
      case "piece":
        baseOptions = ["small", "medium", "large"];
        break;
      case "kg":
        baseOptions = ["0.5kg", "1kg", "2kg"];
        break;
      case "gram":
        baseOptions = ["250g", "500g", "1kg"];
        break;
      default:
        baseOptions = ["small", "medium", "large"];
    }
    // Always add custom option at the end
    return [...baseOptions, "custom"];
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      category: "veg",
      available: true,
      unit: "piece",
      subcategory: "",
      section: "",
      spicyLevel: "",
      preparationTime: "",
      pricing: [{ size: "", price: "", description: "" }],
      useSinglePrice: true,
      singlePrice: "",
    });
    setSectionSearchTerm("");
    setCustomSizes({}); // Reset custom sizes
  };

  // Section management functions with caching
  const fetchSections = async () => {
    // Only fetch if not already loaded
    if (sectionsLoaded) return;
    
    try {
      const response = await fetch('/api/sections');
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
        setSectionsLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleAddNewSection = async (sectionName = null) => {
    const nameToAdd = sectionName || sectionSearchTerm.trim();
    
    if (!nameToAdd) {
      toast.error('Section name is required');
      return;
    }

    // Capitalize first letter
    const capitalizedName = capitalizeFirstLetter(nameToAdd);

    // Check if section already exists
    const existingSection = sections.find(section => 
      section.name.toLowerCase() === capitalizedName.toLowerCase()
    );

    if (existingSection) {
      toast.error('Section already exists');
      return;
    }

    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: capitalizedName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local sections state without refetching
        setSections(prev => [...prev, data.section]);
        setForm({ ...form, section: data.section.name });
        setSectionSearchTerm('');
        setIsSectionDropdownOpen(false);
        toast.success('Section added successfully!');
      } else {
        toast.error(data.error || 'Failed to create section');
      }
    } catch (error) {
      toast.error('Failed to create section');
    }
  };

  const handleSelectSection = (sectionName) => {
    setForm({ ...form, section: sectionName });
    setSectionSearchTerm(sectionName);
    setIsSectionDropdownOpen(false);
  };

  const handleSectionInputChange = (value) => {
    setSectionSearchTerm(value);
    setForm({ ...form, section: value });
    // Only fetch sections if not loaded and dropdown is opening
    if (!isSectionDropdownOpen && !sectionsLoaded) {
      fetchSections();
    }
    setIsSectionDropdownOpen(true);
  };

  // Filter sections based on search term
  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(sectionSearchTerm.toLowerCase())
  );

  // Check if current search term matches any existing section
  const isExactMatch = sections.some(section => 
    section.name.toLowerCase() === sectionSearchTerm.toLowerCase()
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsFixed(window.scrollY > 50); // scroll limit
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/menu/admin");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      toast.error("Error loading menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchMenu();
    // Only fetch sections once
    if (!sectionsLoaded) {
      fetchSections();
    }
    setUsername(session.user?.businessName || session.user?.name || "User");
  }, [session, status, router, sectionsLoaded]);

  // Handle outside clicks for section dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target)) {
        setIsSectionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items based on search, category, and section
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSection = selectedSection === "all" || item.section === selectedSection;
    return matchesSearch && matchesCategory && matchesSection;
  });

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
  };

  // Get only used sections (sections that have items) with counts and smart ordering
  const usedSections = sections.filter(section => 
    items.some(item => item.section === section.name)
  );

  // Calculate usage-based display order
  const sectionsWithUsageOrder = usedSections.map(section => {
    const itemCount = items.filter(item => item.section === section.name).length;
    const totalItems = items.length;
    const usagePercentage = totalItems > 0 ? (itemCount / totalItems) * 100 : 0;
    
    return {
      ...section,
      count: itemCount,
      usagePercentage,
      // Calculate smart display order based on usage
      smartDisplayOrder: usagePercentage * 10 + (section.displayOrder || 0)
    };
  });

  // Sort sections by usage (most used first)
  const sortedSections = sectionsWithUsageOrder.sort((a, b) => {
    // Primary sort: by usage percentage (descending)
    if (b.usagePercentage !== a.usagePercentage) {
      return b.usagePercentage - a.usagePercentage;
    }
    // Secondary sort: by item count (descending)
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    // Tertiary sort: by original display order (ascending)
    return (a.displayOrder || 0) - (b.displayOrder || 0);
  });

  const sectionsWithCounts = [
    { name: "all", displayName: "All Items", count: items.length },
    ...sortedSections
  ];

  async function handleSubmit(e) {
    e.preventDefault();

    // Check for duplicate item only when adding new item
    if (!editItem) {
      const existingItem = items.find(item =>
        item.name.toLowerCase() === form.name.toLowerCase() &&
        item.category === form.category
      );

      if (existingItem) {
        toast.error(`Item "${form.name}" already exists in the ${form.category} category!`);
        return;
      }
    }

    // Prepare form data based on pricing type
    const formData = { ...form };
    
    if (form.useSinglePrice) {
      // For single price items, use the simple price field
      formData.price = parseFloat(form.singlePrice);
      formData.pricing = [];
    } else {
      // For multiple pricing, validate and clean up pricing array
      formData.pricing = form.pricing.filter(p => p.size && p.price);
      if (formData.pricing.length === 0) {
        toast.error("Please add at least one pricing option!");
        return;
      }
      // Remove single price when using multiple pricing
      delete formData.price;
    }

    // Clean up form data
    delete formData.useSinglePrice;
    delete formData.singlePrice;
    
    // Clean up empty optional fields to avoid validation errors
    if (!formData.spicyLevel) formData.spicyLevel = undefined;
    if (!formData.subcategory) formData.subcategory = undefined;
    if (!formData.section) formData.section = undefined;
    if (!formData.preparationTime) formData.preparationTime = undefined;

    const method = editItem ? "PUT" : "POST";
    const url = editItem ? `/api/menu/${editItem._id}` : "/api/menu/admin";

    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      resetForm();
      setEditItem(null);
      setIsFormModalOpen(false);
      fetchMenu();
      toast.success(editItem ? "Item updated successfully!" : "Item added successfully!");
    } else {
      toast.error("Failed to save item. Please try again.");
    }
  }

  function handleEdit(item) {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description,
      category: item.category || "veg",
      available: item.available,
      unit: item.unit || "piece",
      subcategory: item.subcategory || "",
      section: item.section || "",
      spicyLevel: item.spicyLevel || "",
      preparationTime: item.preparationTime || "",
      pricing: item.pricing && item.pricing.length > 0 ? item.pricing : [{ size: "", price: "", description: "" }],
      useSinglePrice: !item.pricing || item.pricing.length === 0,
      singlePrice: item.price || "",
    });
    setSectionSearchTerm(item.section || "");
    
    // Check for custom sizes and set them up
    const newCustomSizes = {};
    if (item.pricing && item.pricing.length > 0) {
      item.pricing.forEach((pricing, index) => {
        const standardSizes = getSizeOptions(item.unit || "piece");
        // If the size is not in standard options (excluding 'custom'), it's a custom size
        if (pricing.size && !standardSizes.slice(0, -1).includes(pricing.size)) {
          newCustomSizes[index] = pricing.size;
        }
      });
    }
    setCustomSizes(newCustomSizes);
    
    setIsFormModalOpen(true);
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
    if (res.ok) fetchMenu();
  }

  async function toggleAvailability(item) {
    const updatedItem = { ...item, available: !item.available };
    
    // Update local state immediately for better UX
    setItems(prevItems => 
      prevItems.map(i => 
        i._id === item._id ? updatedItem : i
      )
    );
    
    // Update edit form if this item is being edited
    if (editItem && editItem._id === item._id) {
      setForm((f) => ({ ...f, available: updatedItem.available }));
      setEditItem(updatedItem);
    }
    
    // Update server in background
    try {
      const res = await fetch(`/api/menu/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });
      
      if (!res.ok) {
        // Revert local state if server update fails
        setItems(prevItems => 
          prevItems.map(i => 
            i._id === item._id ? item : i
          )
        );
        toast.error('Failed to update availability');
      }
    } catch (error) {
      // Revert local state if request fails
      setItems(prevItems => 
        prevItems.map(i => 
          i._id === item._id ? item : i
        )
      );
      toast.error('Failed to update availability');
    }
  }

  const toggleStyles = {
    switch: {
      position: "relative",
      display: "inline-block",
      width: "40px",
      height: "22px",
    },
    slider: {
      position: "absolute",
      cursor: "pointer",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#ccc",
      transition: ".4s",
      borderRadius: "22px",
    },
    sliderBefore: {
      position: "absolute",
      content: '""',
      height: "18px",
      width: "18px",
      borderRadius: "50%",
      left: "2px",
      bottom: "2px",
      backgroundColor: "white",
      transition: ".4s",
    },
    input: {
      opacity: 0,
      width: 0,
      height: 0,
      position: "absolute",
    },
  };

  const handleAddItem = () => {
    setEditItem(null);
    resetForm();
    setIsFormModalOpen(true);
  };

  if (status === "loading") return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50 overflow-hidden">
      <div className="flex flex-col items-center justify-center space-y-3">
        <LoadingSpinner size="40" />
        <p className="text-gray-600">Loading menu…</p>
      </div>
    </div>
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Header className=""/> 

      <div className="min-h-screen bg-gray-50 relative w-full mt-20 xs:mt-18 sm:mt-20 md:mt-21 lg:mt-18">
        {/* Header - Ultra Responsive */}
        <div className="bg-white border-b border-gray-200 
          py-3 xs:py-4 sm:py-5 md:py-6 
          px-2 xs:px-3 sm:px-4 md:px-6">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-3">
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="rounded-lg xs:rounded-xl 
                p-2 xs:p-2.5 sm:p-3 
                bg-gray-100">
                <MdOutlineRestaurantMenu className="text-lg xs:text-xl sm:text-2xl text-amber-600" />
              </div>
              <div>
                <h1 className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900">Menu Management</h1>
                <p className="text-xs xs:text-sm text-gray-500 hidden xs:block">Manage your restaurant's offerings</p>
              </div>
            </div>
          </div>

          {/* Stats - Ultra Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 
            gap-2 xs:gap-3 sm:gap-4 
            mt-3 xs:mt-4 sm:mt-5 md:mt-6">
            {/* Stats Cards - Responsive */}
            <div className="bg-white border border-gray-200 
              rounded-lg xs:rounded-xl 
              p-2 xs:p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] xs:text-xs text-gray-500">Total Items</p>
                  <p className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900">{items.length}</p>
                </div>
                <FaUtensils className="text-sm xs:text-lg sm:text-xl text-gray-400" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 
              rounded-lg xs:rounded-xl 
              p-2 xs:p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] xs:text-xs text-gray-500">Available</p>
                  <p className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900">{items.filter(item => item.available).length}</p>
                </div>
                <MdInventory className="text-sm xs:text-lg sm:text-xl text-gray-400" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 
              rounded-lg xs:rounded-xl 
              p-2 xs:p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] xs:text-xs text-gray-500">Veg Items</p>
                  <p className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900">{items.filter(item => item.category === 'veg').length}</p>
                </div>
                <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-full border-2 border-green-500/50 flex items-center justify-center">
                  <div className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 bg-green-500/50 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 
              rounded-lg xs:rounded-xl 
              p-2 xs:p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] xs:text-xs text-gray-500">Non-Veg</p>
                  <p className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900">{items.filter(item => item.category === 'non-veg').length}</p>
                </div>
                <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 border-2 border-red-500/50 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[2px] xs:border-l-[3px] sm:border-l-[4px] border-r-[2px] xs:border-r-[3px] sm:border-r-[4px] border-b-[3px] xs:border-b-[4px] sm:border-b-[6px] border-l-transparent border-r-transparent border-b-red-500/50"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container - Ultra Responsive */}
        <div className="flex flex-col xl:flex-row">
          {/* Enhanced Menu Section */}
          <div className="flex-1 bg-white">
            {/* Search and Filter Section - Mobile First */}
            <div className="sticky top-0 bg-white border-b border-gray-200 
              p-2 xs:p-3 sm:p-4 md:p-6 z-20">
              <div>
                {/* Search Bar - Responsive */}
                <div className="relative mb-3 xs:mb-4 sm:mb-5 md:mb-6">
                  <div className="absolute inset-y-0 left-0 
                    pl-3 xs:pl-4 
                    flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400 text-sm xs:text-base" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full 
                      pl-9 xs:pl-12 
                      pr-3 xs:pr-4 
                      py-2 xs:py-2.5 sm:py-3 
                      bg-white border border-gray-300 
                      rounded-lg xs:rounded-xl 
                      focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 
                      transition text-gray-800 placeholder-gray-400
                      text-sm xs:text-base"
                  />
                </div>

                {/* Category Filters - Mobile Optimized */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                    <span className="text-gray-600 text-xs xs:text-sm whitespace-nowrap">Filter by:</span>
                    <div className="flex flex-wrap gap-1 xs:gap-2">
                      <button
                        onClick={() => handleCategoryChange("all")}
                        className={`px-2 xs:px-3 sm:px-4 
                          py-1.5 xs:py-2 
                          rounded-md xs:rounded-lg 
                          text-xs xs:text-sm 
                          border transition-colors whitespace-nowrap ${
                          selectedCategory === "all"
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        All Items
                      </button>
                      <button
                        onClick={() => handleCategoryChange("veg")}
                        className={`px-3 sm:px-4 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 whitespace-nowrap ${
                          selectedCategory === "veg"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-500/60 flex-shrink-0">
                          <div className="w-2 h-2 bg-emerald-500/60 rounded-full mx-auto mt-0.5"></div>
                        </div>
                        <span>Veg</span>
                      </button>
                      <button
                        onClick={() => handleCategoryChange("non-veg")}
                        className={`px-3 sm:px-4 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 whitespace-nowrap ${
                          selectedCategory === "non-veg"
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="w-4 h-4 border-2 border-rose-500/60 flex-shrink-0 flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-rose-500/60"></div>
                        </div>
                        <span>Non-Veg</span>
                      </button>
                      <button
                        onClick={() => handleCategoryChange("jain")}
                        className={`px-3 sm:px-4 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 whitespace-nowrap ${
                          selectedCategory === "jain"
                            ? "bg-amber-700 text-white border-amber-700"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-amber-600/60 flex-shrink-0">
                          <div className="w-2 h-2 bg-amber-600/60 rounded-full mx-auto mt-0.5"></div>
                        </div>
                        <span>Jain</span>
                      </button>
                      <button
                        onClick={() => handleCategoryChange("beverages")}
                        className={`px-3 sm:px-4 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 whitespace-nowrap ${
                          selectedCategory === "beverages"
                            ? "bg-sky-600 text-white border-sky-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-sky-600/60 flex-shrink-0">
                          <div className="w-2 h-2 bg-sky-600/60 rounded-full mx-auto mt-0.5"></div>
                        </div>
                        <span>Beverages</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Add Item Button - Responsive */}
                  <div className="w-full xs:w-auto flex justify-end mt-2 xs:mt-0">
                    <button
                      onClick={handleAddItem}
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-4 sm:px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FaPlus className="text-sm xs:text-base" />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items Container - Ultra Responsive Layout */}
            <div className="p-0">
              <div className="w-full 
                px-2 xs:px-3 sm:px-4 md:px-6">
                {loading ? (
                  <div className="flex items-center justify-center py-10 xs:py-15 sm:py-20">
                    <LoadingSpinner size="40" />
                  </div>
                ) : (
                  <div className="flex flex-col xl:flex-row gap-3 xs:gap-4 sm:gap-6">
                    {/* Left Sidebar - Responsive Sections */}
                    <div className="xl:w-64 xl:flex-shrink-0">
                      <div className="bg-white 
                        rounded-lg xs:rounded-xl 
                        shadow-sm border border-gray-200 
                        p-3 xs:p-4 
                        xl:sticky xl:top-44 xl:max-h-[calc(100vh-12rem)] xl:overflow-y-auto z-10">
                        <h3 className="text-base xs:text-lg font-semibold text-gray-800 
                          mb-3 xs:mb-4 
                          flex items-center gap-2">
                          <span>📂</span>
                          <span>Sections</span>
                        </h3>
                        <div className="space-y-1 xs:space-y-2">
                          {sectionsWithCounts.map((section) => (
                            <button
                              key={section.name}
                              onClick={() => handleSectionChange(section.name)}
                              className={`w-full text-left 
                                px-2 xs:px-3 
                                py-2 xs:py-2.5 
                                rounded-md xs:rounded-lg 
                                transition-colors flex items-center justify-between 
                                text-sm xs:text-base ${
                                selectedSection === section.name
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "hover:bg-gray-50 text-gray-700"
                              }`}
                            >
                              <div className="flex items-center gap-1 xs:gap-2">
                                <span className="text-xs xs:text-sm">
                                  {section.name === "all" ? "📋" : section.icon || "📂"}
                                </span>
                                <span className="font-medium text-xs xs:text-sm">
                                  {section.displayName || section.name}
                                </span>
                              </div>
                              <span className={`text-[10px] xs:text-xs 
                                px-1.5 xs:px-2 
                                py-0.5 xs:py-1 
                                rounded-full ${
                                selectedSection === section.name
                                  ? "bg-amber-200 text-amber-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {section.count}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Content - Ultra Responsive Menu Grid */}
                    <div className="flex-1">
                      <div className="grid gap-2 xs:gap-3 sm:gap-4 
                        grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredItems.map((item) => (
                      <div key={item._id} className="group bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                        {/* Card Header */}
                        <div className="relative p-3 bg-white border-b border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {item.category === "veg" ? (
                                <div className="bg-gray-100 rounded-full p-1">
                                  <div className="w-3 h-3 rounded-full border-2 border-emerald-600 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                                  </div>
                                </div>
                              ) : item.category === "non-veg" ? (
                                <div className="bg-gray-100 rounded-full p-1">
                                  <div className="w-3 h-3 border-2 border-rose-600 flex items-center justify-center">
                                    <div className="w-0 h-0 border-l-[2px] border-r-[2px] border-b-[3px] border-l-transparent border-r-transparent border-b-rose-600"></div>
                                  </div>
                                </div>
                              ) : item.category === "jain" ? (
                                <div className="bg-gray-100 rounded-full p-1">
                                  <div className="w-3 h-3 rounded-full border-2 border-amber-700 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-amber-700 rounded-full"></div>
                                  </div>
                                </div>
                              ) : item.category === "beverages" ? (
                                <div className="bg-gray-100 rounded-full p-1">
                                  <div className="w-3 h-3 rounded-full border-2 border-sky-600 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-sky-600 rounded-full"></div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-100 rounded-full p-1">
                                  <div className="w-3 h-3 rounded-full border-2 border-gray-600 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-gray-600 rounded-full"></div>
                                  </div>
                                </div>
                              )}
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {item.section && (
                                    <span className="inline-block bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full">
                                      📂 {item.section}
                                    </span>
                                  )}
                                  {item.subcategory && (
                                    <span className="inline-block bg-gray-100 text-gray-700 text-[9px] px-1.5 py-0.5 rounded-full">
                                      {item.subcategory}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${item.available ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                {item.available ? "Available" : "Unavailable"}
                              </span>
                              {item.spicyLevel && (
                                <span className="inline-flex items-center bg-rose-50 text-rose-700 text-[10px] px-1.5 py-0.5 rounded-full border border-rose-200">
                                  🌶️ {item.spicyLevel}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {item.description && (
                            <p className="text-gray-600 text-xs leading-relaxed">{item.description}</p>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-3">
                          {/* Pricing Section */}
                          <div className="mb-3">
                            {item.pricing && item.pricing.length > 0 ? (
                              <div className="space-y-1">
                                <h4 className="text-xs font-medium text-gray-800 mb-2">Pricing Options</h4>
                                {item.pricing.map((pricing, index) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 border border-gray-200">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-900 font-semibold text-sm">₹{pricing.price}</span>
                                      <span className="text-gray-600 text-xs">{pricing.size}</span>
                                    </div>
                                    {pricing.description && (
                                      <span className="text-gray-500 text-[10px] bg-white px-1.5 py-0.5 rounded-full border border-gray-200">
                                        {pricing.description}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                <span className="text-gray-500 text-[10px]">per {item.unit}</span>
                              </div>
                            ) : (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-900 font-semibold text-lg">₹{item.price}</span>
                                  <span className="text-gray-600 text-xs">per {item.unit}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Preparation Time */}
                          {item.preparationTime && (
                            <div className="flex items-center space-x-1 mb-2 text-gray-500">
                              <FaClock className="text-gray-400 text-xs" />
                              <span className="text-xs">{item.preparationTime} min</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            {/* Availability Toggle */}
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600 font-medium">Available</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={item.available} 
                                  onChange={() => toggleAvailability(item)}
                                  className="sr-only peer"
                                />
                                <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full transition-colors duration-300 peer-checked:bg-amber-500">
                                  <div className={`absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-4 w-4 transition-transform duration-300 shadow-sm ${item.available ? 'translate-x-4 border-amber-500' : 'translate-x-0'}`}></div>
                                </div>
                              </label>
                            </div>

                            {/* Edit and Delete Buttons */}
                            <div className="flex items-center space-x-1">
                              <button 
                                onClick={() => handleEdit(item)} 
                                className="flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                title="Edit Item"
                              >
                                <FaEdit className="text-xs" />
                              </button>
                              <button 
                                onClick={() => handleDelete(item._id)} 
                                className="flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                title="Delete Item"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Modal for Add/Edit */}
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative transform transition-all duration-300 scale-100">
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-200 text-gray-900 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 rounded-xl p-2 text-amber-600">
                      <FaPlus className="text-xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Add Menu Item</h2>
                      <p className="text-gray-500 text-sm">Create a new delicious offering</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsFormModalOpen(false);
                      resetForm();
                    }}
                    className="bg-gray-100 hover:bg-gray-200 rounded-xl p-2 transition-colors"
                  >
                    <FaTimes className="text-xl text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Section Selection - Most Important */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">📂 Section</h3>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
                      <div className="relative" ref={sectionDropdownRef}>
                        {/* Searchable Input */}
                        <div className="relative">
                          <input
                            type="text"
                            value={sectionSearchTerm}
                            onChange={(e) => handleSectionInputChange(e.target.value)}
                            onFocus={() => {
                              // Lazy load sections on first focus
                              if (!sectionsLoaded) {
                                fetchSections();
                              }
                              setIsSectionDropdownOpen(true);
                            }}
                            placeholder="Type or select section (e.g., Pizza, Burgers, Sandwiches)"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors hover:border-amber-400"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <FaChevronDown 
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                isSectionDropdownOpen ? 'transform rotate-180' : ''
                              }`} 
                            />
                          </div>
                        </div>

                        {/* Dropdown Menu */}
                        {isSectionDropdownOpen && (sectionSearchTerm.length > 0 || sections.length > 0) && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {/* Show sections based on search term */}
                            {sectionSearchTerm.trim() ? (
                              <>
                                {/* Filtered Sections when typing */}
                                {filteredSections.length > 0 && (
                                  <div className="py-1">
                                    {filteredSections.map((section) => (
                                      <button
                                        key={section._id}
                                        type="button"
                                        onClick={() => handleSelectSection(section.name)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left hover:bg-amber-50 focus:bg-amber-50 transition-colors flex items-center space-x-2 text-sm sm:text-base"
                                      >
                                        <span className="text-lg">{section.icon}</span>
                                        <span className="text-gray-900">{section.name}</span>
                                        {section.name === form.section && (
                                          <FaCheck className="w-4 h-4 text-amber-600 ml-auto" />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* Add New Section - Show only if search term doesn't match existing */}
                                {!isExactMatch && (
                                  <>
                                    {filteredSections.length > 0 && <hr className="my-1" />}
                                    <button
                                      type="button"
                                      onClick={() => handleAddNewSection(sectionSearchTerm)}
                                      className="w-full px-4 py-2 text-left hover:bg-green-50 focus:bg-green-50 transition-colors flex items-center space-x-2 text-green-600"
                                    >
                                      <FaPlus className="w-4 h-4" />
                                      <span>Add "{capitalizeFirstLetter(sectionSearchTerm)}"</span>
                                    </button>
                                  </>
                                )}

                                {/* No results message */}
                                {filteredSections.length === 0 && isExactMatch && (
                                  <div className="px-4 py-3 text-center text-gray-500 text-sm">
                                    Section already selected
                                  </div>
                                )}
                              </>
                            ) : (
                              /* Show all sections when no search term */
                              sections.length > 0 && (
                                <div className="py-1">
                                  {sections.map((section) => (
                                    <button
                                      key={section._id}
                                      type="button"
                                      onClick={() => handleSelectSection(section.name)}
                                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left hover:bg-amber-50 focus:bg-amber-50 transition-colors flex items-center space-x-2 text-sm sm:text-base"
                                    >
                                      <span className="text-lg">{section.icon}</span>
                                      <span className="text-gray-900">{section.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Choose which section this item belongs to. This helps organize your menu.</p>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300/30 focus:border-amber-400 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                        <select
                          value={form.unit}
                          onChange={(e) => setForm({ ...form, unit: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300/30 focus:border-amber-400 transition-all"
                          required
                        >
                          <option value="piece">Piece</option>
                          <option value="plate">Plate</option>
                          <option value="bowl">Bowl</option>
                          <option value="liter">Liter</option>
                          <option value="ml">ML</option>
                          <option value="kg">KG</option>
                          <option value="gram">Gram</option>
                          <option value="serving">Serving</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300/30 focus:border-amber-400 transition-all resize-none"
                        rows="3"
                      />
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Category</h3>
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 bg-gray-50 rounded-xl p-4">
                      {/* Vegetarian */}
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value="veg"
                          checked={form.category === "veg"}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${form.category === "veg" ? "border-green-600 bg-green-100" : "border-gray-300"}`}>
                          <div className={`w-3 h-3 rounded-full ${form.category === "veg" ? "bg-green-600" : "bg-gray-300"}`}></div>
                        </div>
                        <span className={`font-medium ${form.category === "veg" ? "text-green-600" : "text-gray-600"}`}>Vegetarian</span>
                      </label>
                      
                      {/* Non-Vegetarian */}
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value="non-veg"
                          checked={form.category === "non-veg"}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 border-2 flex items-center justify-center ${form.category === "non-veg" ? "border-red-600 bg-red-100" : "border-gray-300"}`}>
                          <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent ${form.category === "non-veg" ? "border-b-red-600" : "border-b-gray-300"}`}></div>
                        </div>
                        <span className={`font-medium ${form.category === "non-veg" ? "text-red-600" : "text-gray-600"}`}>Non-Vegetarian</span>
                      </label>

                      {/* Jain */}
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value="jain"
                          checked={form.category === "jain"}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${form.category === "jain" ? "border-orange-600 bg-orange-100" : "border-gray-300"}`}>
                          <div className={`w-3 h-3 rounded-full ${form.category === "jain" ? "bg-orange-600" : "bg-gray-300"}`}></div>
                        </div>
                        <span className={`font-medium ${form.category === "jain" ? "text-orange-600" : "text-gray-600"}`}>Jain</span>
                      </label>

                      {/* Beverages */}
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value="beverages"
                          checked={form.category === "beverages"}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${form.category === "beverages" ? "border-blue-600 bg-blue-100" : "border-gray-300"}`}>
                          <div className={`w-3 h-3 rounded-full ${form.category === "beverages" ? "bg-blue-600" : "bg-gray-300"}`}></div>
                        </div>
                        <span className={`font-medium ${form.category === "beverages" ? "text-blue-600" : "text-gray-600"}`}>Beverages</span>
                      </label>

                      {/* None */}
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value="none"
                          checked={form.category === "none"}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${form.category === "none" ? "border-gray-600 bg-gray-100" : "border-gray-300"}`}>
                          <div className={`w-3 h-3 rounded-full ${form.category === "none" ? "bg-gray-600" : "bg-gray-300"}`}></div>
                        </div>
                        <span className={`font-medium ${form.category === "none" ? "text-gray-600" : "text-gray-600"}`}>None</span>
                      </label>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Pricing</h3>
                    
                    {/* Pricing Type Toggle */}
                    <div className="flex items-center space-x-4 bg-gray-50 rounded-xl p-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pricingType"
                          checked={form.useSinglePrice}
                          onChange={() => setForm({ ...form, useSinglePrice: true })}
                          className="w-4 h-4 text-amber-600 focus:ring-amber-300"
                        />
                        <span className="font-medium">Single Price</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pricingType"
                          checked={!form.useSinglePrice}
                          onChange={() => setForm({ ...form, useSinglePrice: false })}
                          className="w-4 h-4 text-amber-600 focus:ring-amber-300"
                        />
                        <span className="font-medium">Multiple Sizes</span>
                      </label>
                    </div>

                    {/* Single Price Input */}
                    {form.useSinglePrice && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                        <input
                          type="number"
                          value={form.singlePrice}
                          onChange={(e) => setForm({ ...form, singlePrice: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300/30 focus:border-amber-400 transition-all"
                          required
                        />
                      </div>
                    )}

                    {/* Multiple Pricing Options */}
                    {!form.useSinglePrice && (
                      <div className="space-y-3">
                        {form.pricing.map((pricing, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                                <select
                                  value={customSizes[index] !== undefined ? 'custom' : pricing.size}
                                  onChange={(e) => handleSizeSelection(index, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300/30 text-sm"
                                  required
                                >
                                  <option value="">Select Size</option>
                                  {getSizeOptions(form.unit).map(size => (
                                    <option key={size} value={size}>
                                      {size === 'custom' ? '🔧 Custom Size' : size}
                                    </option>
                                  ))}
                                </select>
                                
                                {/* Custom Size Input */}
                                {customSizes[index] !== undefined && (
                                  <div className="mt-2">
                                    <input
                                      type="text"
                                      value={customSizes[index] || ''}
                                      onChange={(e) => handleCustomSizeChange(index, e.target.value)}
                                      placeholder="Enter custom size (e.g., 1.5L, XL, Family Pack)"
                                      className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 text-sm bg-amber-50"
                                      required
                                    />
                                    <p className="text-xs text-amber-600 mt-1">
                                      💡 Enter any custom size like "1.5L", "XL", "Family Pack", etc.
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹)</label>
                                <input
                                  type="number"
                                  value={pricing.price}
                                  onChange={(e) => updatePricingOption(index, 'price', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300/30 text-sm"
                                  required
                                />
                              </div>
                              <div className="flex items-end space-x-2">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                  <input
                                    type="text"
                                    value={pricing.description}
                                    onChange={(e) => updatePricingOption(index, 'description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300/30 text-sm"
                                  />
                                </div>
                                {form.pricing.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removePricingOption(index)}
                                    className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                                  >
                                    <FaTimes className="text-sm" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addPricingOption}
                          className="w-full bg-amber-100 text-amber-700 py-3 rounded-xl font-medium hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <FaPlus />
                          Add Size Option
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Additional Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                        <select
                          value={form.subcategory}
                          onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300/30 focus:border-amber-400 transition-all"
                        >
                          <option value="">Select Subcategory</option>
                          <option value="beverages">Beverages</option>
                          <option value="appetizers">Appetizers</option>
                          <option value="main-course">Main Course</option>
                          <option value="desserts">Desserts</option>
                          <option value="snacks">Snacks</option>
                          <option value="salads">Salads</option>
                          <option value="soups">Soups</option>
                          <option value="breads">Breads</option>
                          <option value="rice">Rice Items</option>
                          <option value="specials">Chef's Specials</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Spicy Level</label>
                        <select
                          value={form.spicyLevel}
                          onChange={(e) => setForm({ ...form, spicyLevel: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300/30 focus:border-amber-400 transition-all"
                        >
                          <option value="">Select Level</option>
                          <option value="mild">Mild</option>
                          <option value="medium">Medium</option>
                          <option value="spicy">Spicy</option>
                          <option value="extra-spicy">Extra Spicy</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prep Time (min)</label>
                        <input
                          type="number"
                          value={form.preparationTime}
                          onChange={(e) => setForm({ ...form, preparationTime: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300/30 focus:border-amber-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Availability Toggle */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                    <span className="text-lg font-medium text-gray-700">Item Available</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.available}
                        onChange={() => setForm({ ...form, available: !form.available })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300/30 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormModalOpen(false);
                        resetForm();
                      }}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <FaPlus />
                      Add Item
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
