"use client";
import { useState, useEffect, useRef } from "react";
import { FaPlus, FaSearch, FaTimes, FaEdit, FaTrash, FaUtensils, FaChartLine, FaEye, FaClock } from "react-icons/fa";
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
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const [isFixed, setIsFixed] = useState(false);
  const router = useRouter();

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

  // Get size options based on unit
  const getSizeOptions = (unit) => {
    switch (unit) {
      case "liter":
        return ["0.5L", "1L", "2L"];
      case "ml":
        return ["250ml", "500ml", "750ml", "1000ml"];
      case "plate":
      case "bowl":
      case "serving":
        return ["half", "full"];
      case "piece":
        return ["small", "medium", "large"];
      case "kg":
        return ["0.5kg", "1kg", "2kg"];
      case "gram":
        return ["250g", "500g", "1kg"];
      default:
        return ["small", "medium", "large"];
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      category: "veg",
      available: true,
      unit: "piece",
      subcategory: "",
      spicyLevel: "",
      preparationTime: "",
      pricing: [{ size: "", price: "", description: "" }],
      useSinglePrice: true,
      singlePrice: "",
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsFixed(window.scrollY > 50); // scroll limit
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      setUsername(session.user.name || "");
    }
  }, [status, session]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/menu/admin");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching menu:", error);
      toast.error("Error loading menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  async function handleSubmit(e) {
    e.preventDefault();

    // Check for duplicate item only when adding new item
    if (!editItem) {
      const existingItem = items.find(item =>
        item.name.toLowerCase() === form.name.toLowerCase()
      );

      if (existingItem) {
        toast.error(`Item "${form.name}" already exists in the menu!`);
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
      spicyLevel: item.spicyLevel || "",
      preparationTime: item.preparationTime || "",
      pricing: item.pricing && item.pricing.length > 0 ? item.pricing : [{ size: "", price: "", description: "" }],
      useSinglePrice: !item.pricing || item.pricing.length === 0,
      singlePrice: item.price || "",
    });
    setIsFormModalOpen(true);
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
    if (res.ok) fetchMenu();
  }

  async function toggleAvailability(item) {
    const updatedItem = { ...item, available: !item.available };
    const res = await fetch(`/api/menu/${item._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedItem),
    });
    if (res.ok) {
      fetchMenu();
      if (editItem && editItem._id === item._id) {
        setForm((f) => ({ ...f, available: updatedItem.available }));
        setEditItem(updatedItem);
      }
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
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center z-50 overflow-hidden">
      <div className="flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="40" />
        <p className="text-amber-600 font-medium animate-pulse">Loading Menu...</p>
      </div>
    </div>
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Header className=""/> 

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative w-full mt-21 sm:mt-18 md:mt-18">
        {/* Professional Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-600 text-white py-8 px-6 shadow-2xl relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <MdOutlineRestaurantMenu className="text-4xl text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Menu Management</h1>
                  <p className="text-amber-100 text-lg mt-1">Manage your restaurant's delicious offerings</p>
                </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm">Total Items</p>
                    <p className="text-2xl font-bold">{items.length}</p>
                  </div>
                  <FaUtensils className="text-2xl text-amber-200" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm">Available</p>
                    <p className="text-2xl font-bold">{items.filter(item => item.available).length}</p>
                  </div>
                  <MdInventory className="text-2xl text-green-200" />
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm">Veg Items</p>
                    <p className="text-2xl font-bold">{items.filter(item => item.category === 'veg').length}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-green-200 flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-200 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm">Non-Veg</p>
                    <p className="text-2xl font-bold">{items.filter(item => item.category === 'non-veg').length}</p>
                  </div>
                  <div className="w-6 h-6 border-2 border-red-200 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-red-200"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:h-screen overflow-hidden">
          {/* Right: Enhanced Menu Section */}
          <div className="flex-1 overflow-y-auto bg-white/70 backdrop-blur-sm shadow-inner">
            {/* Enhanced Search and Filter Section */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-amber-200/50 p-6 z-20">
              <div>
                {/* Search Bar */}
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaSearch className="text-amber-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search delicious menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-2 border-amber-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-300/30 focus:border-amber-400 transition-all duration-300 text-gray-700 placeholder-gray-400 shadow-lg"
                  />
                </div>

                {/* Category Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                    <span className="text-gray-600 font-medium whitespace-nowrap">Filter by:</span>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleCategoryChange("all")} 
                        className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                          selectedCategory === "all" 
                            ? "bg-amber-500 text-white shadow-lg" 
                            : "bg-white/80 text-gray-600 hover:bg-amber-100"
                        }`}
                      >
                        All Items
                      </button>
                      <button 
                        onClick={() => handleCategoryChange("veg")} 
                        className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                          selectedCategory === "veg" 
                            ? "bg-green-500 text-white shadow-lg" 
                            : "bg-white/80 text-gray-600 hover:bg-green-100"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-green-200 flex-shrink-0">
                          <div className="w-2 h-2 bg-green-200 rounded-full mx-auto mt-0.5"></div>
                        </div>
                        <span>Veg</span>
                      </button>
                      <button 
                        onClick={() => handleCategoryChange("non-veg")} 
                        className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                          selectedCategory === "non-veg" 
                            ? "bg-red-500 text-white shadow-lg" 
                            : "bg-white/80 text-gray-600 hover:bg-red-100"
                        }`}
                      >
                        <div className="w-4 h-4 border-2 border-red-200 flex-shrink-0 flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-red-200"></div>
                        </div>
                        <span>Non-Veg</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Add Item Button */}
                  <div className="w-full sm:w-auto flex justify-end">
                    <button
                      onClick={handleAddItem}
                      className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <FaPlus className="text-lg" />
                      <span>Add New Item</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items Container */}
            <div className="p-0">
              <div className="w-full px-6">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <LoadingSpinner size="40" />
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredItems.map((item) => (
                      <div key={item._id} className="group bg-white/90 backdrop-blur-sm border border-amber-200/50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2">
                        {/* Card Header */}
                        <div className="relative p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-200/30">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {item.category === "veg" ? (
                                <div className="bg-green-100 rounded-full p-2 shadow-sm">
                                  <div className="w-4 h-4 rounded-full border-2 border-green-600 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-red-100 rounded-full p-2 shadow-sm">
                                  <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center">
                                    <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-red-600"></div>
                                  </div>
                                </div>
                              )}
                              <div>
                                <h3 className="text-lg font-bold text-gray-800 group-hover:text-amber-700 transition-colors">{item.name}</h3>
                                {item.subcategory && (
                                  <span className="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full mt-1 font-medium">
                                    {item.subcategory}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${item.available ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
                                {item.available ? "Available" : "Unavailable"}
                              </span>
                              {item.spicyLevel && (
                                <span className="inline-flex items-center bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full border border-red-200">
                                  🌶️ {item.spicyLevel}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {item.description && (
                            <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-6">
                          {/* Pricing Section */}
                          <div className="mb-6">
                            {item.pricing && item.pricing.length > 0 ? (
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Pricing Options</h4>
                                {item.pricing.map((pricing, index) => (
                                  <div key={index} className="flex items-center justify-between bg-amber-50/50 rounded-lg p-3 border border-amber-200/30">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-amber-700 font-bold text-lg">₹{pricing.price}</span>
                                      <span className="text-gray-600 text-sm font-medium">{pricing.size}</span>
                                    </div>
                                    {pricing.description && (
                                      <span className="text-gray-500 text-xs bg-white px-2 py-1 rounded-full">
                                        {pricing.description}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                <span className="text-gray-400 text-xs">per {item.unit}</span>
                              </div>
                            ) : (
                              <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 border border-amber-200/50">
                                <div className="flex items-center justify-between">
                                  <span className="text-amber-700 font-bold text-2xl">₹{item.price}</span>
                                  <span className="text-gray-600 text-sm font-medium">per {item.unit}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Preparation Time */}
                          {item.preparationTime && (
                            <div className="flex items-center space-x-2 mb-4 text-gray-500">
                              <FaClock className="text-amber-500" />
                              <span className="text-sm">{item.preparationTime} minutes</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            {/* Availability Toggle */}
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-600 font-medium">Available</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={item.available} 
                                  onChange={() => toggleAvailability(item)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                              </label>
                            </div>

                            {/* Edit and Delete Buttons */}
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleEdit(item)} 
                                className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all duration-300 shadow-sm hover:shadow-md"
                                title="Edit Item"
                              >
                                <FaEdit className="text-sm" />
                              </button>
                              <button 
                                onClick={() => handleDelete(item._id)} 
                                className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all duration-300 shadow-sm hover:shadow-md"
                                title="Delete Item"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 rounded-xl p-2">
                      <FaPlus className="text-xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Add Menu Item</h2>
                      <p className="text-amber-100 text-sm">Create a new delicious offering</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsFormModalOpen(false);
                      resetForm();
                    }}
                    className="bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-all duration-300"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
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
                    <div className="flex items-center justify-center space-x-6 bg-gray-50 rounded-xl p-4">
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
                                  value={pricing.size}
                                  onChange={(e) => updatePricingOption(index, 'size', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300/30 text-sm"
                                  required
                                >
                                  <option value="">Select Size</option>
                                  {getSizeOptions(form.unit).map(size => (
                                    <option key={size} value={size}>{size}</option>
                                  ))}
                                </select>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
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
