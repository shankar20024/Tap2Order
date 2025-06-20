"use client";
import { useState, useEffect, useRef } from "react";
import { FaPlus, FaSearch, FaTimes, FaEdit, FaTrash } from "react-icons/fa";
import { MdOutlineRestaurantMenu } from "react-icons/md";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    available: true,
    category: "veg",
  });
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { data: session, status } = useSession();
  const [isFixed, setIsFixed] = useState(false);
  const router = useRouter();

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

  async function fetchMenu() {
    const res = await fetch("/api/menu/admin");
    const data = await res.json();
    setItems(data);
  }

  useEffect(() => {
    fetchMenu();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    // Check for duplicate item only when adding new item
    if (!editItem) {  // Only check for duplicates when adding new item
      const existingItem = items.find(item =>
        item.name.toLowerCase() === form.name.toLowerCase()
      );

      if (existingItem) {
        if (editItem && editItem._id === existingItem._id) {
          // If we're editing the same item, allow it
        }

        toast.error(`Item "${form.name}" already exists in the menu!`);
        return;
      }
    }

    const method = editItem ? "PUT" : "POST";
    const url = editItem ? `/api/menu/${editItem._id}` : "/api/menu/admin";

    const res = await fetch(url, {
      method,
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      setForm({ name: "", description: "", price: "", available: true, category: "veg" });
      setEditItem(null);
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
      price: item.price,
      available: item.available,
      category: item.category || "veg",
    });
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
    setForm({
      name: "",
      description: "",
      price: "",
      available: true,
      category: "veg",
    });
    setIsFormModalOpen(true);
  };

  return (
    <>
      <ToastContainer />
      {/* Header */}
     <Header className="px-6"/> 

      <div className="min-h-screen relative w-full mt-11 md:mt-21">
        <div className="flex flex-col md:flex-row md:h-screen overflow-hidden">
          {/* Left: Fixed Form Section */}
          <div className="md:max-w-xs w-full bg-white p-6 md:border-r md:border-gray-200 overflow-y-auto">            {/* Form Modal for Mobile */}
            {isFormModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative">
                  <button
                    onClick={() => {
                      setIsFormModalOpen(false);
                      setForm({
                        name: "",
                        description: "",
                        price: "",
                        available: true,
                        category: "veg",
                      });
                    }}
                    className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl"
                  >
                    <FaTimes />
                  </button>
                  <h2 className="text-xl font-bold mb-4">Add Menu Item</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="border p-2 w-full rounded"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="border p-2 w-full rounded"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="border p-2 w-full rounded"
                      required
                    />

                    <div className="flex items-center space-x-3 mb-5 mt-3">
                      <span
                        className={`text-sm font-medium ${form.category === "veg" ? "text-green-600" : "text-gray-400"}`}
                      >
                        <div className="badge-container veg-badge-container">
                          <div className="circle" />
                        </div>
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={form.category === "non-veg"}
                          onChange={() =>
                            setForm({ ...form, category: form.category === "veg" ? "non-veg" : "veg" })
                          }
                        />
                        <div className="w-10 h-6 bg-gray-200 peer-checked:bg-red-500 rounded-full transition-all duration-300 shadow-inner"></div>
                        <div
                          className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-md transition-all transform ${form.category === "non-veg" ? "translate-x-4" : ""}`}
                        ></div>
                      </label>
                      <span
                        className={`text-sm font-medium ${form.category === "non-veg" ? "text-red-600" : "text-gray-400"}`}
                      >
                        <div className="badge-container non-veg-badge-container">
                          <div className="triangle" />
                        </div>
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 select-none">
                      <span>Available</span>
                      <div style={toggleStyles.switch} onClick={() => setForm({ ...form, available: !form.available })}>
                        <input type="checkbox" checked={form.available} readOnly style={toggleStyles.input} />
                        <span
                          style={{
                            ...toggleStyles.slider,
                            ...(form.available ? { backgroundColor: "#F59E0B" } : {}),
                          }}
                          aria-hidden="true"
                        >
                          <span
                            style={{
                              ...toggleStyles.sliderBefore,
                              transform: form.available ? "translateX(18px)" : "translateX(0)",
                            }}
                          />
                        </span>
                      </div>
                    </div>

                    <button className="flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2 rounded w-full hover:bg-amber-700">
                      <FaPlus /> Add Menu Item
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Form for Desktop */}
            {!editItem && !isFormModalOpen && (
              <div className="hidden md:block">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-2 w-full rounded" required />
                  <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border p-2 w-full rounded" />
                  <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border p-2 w-full rounded" required />

                  <div className="flex items-center space-x-3 mb-5 mt-3">
                    <span className={`text-sm font-medium ${form.category === "veg" ? "text-green-600" : "text-gray-400"}`}>
                      <div className="badge-container veg-badge-container"><div className="circle" /></div>
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={form.category === "non-veg"} onChange={() => setForm({ ...form, category: form.category === "veg" ? "non-veg" : "veg" })} />
                      <div className="w-10 h-6 bg-green-500 peer-checked:bg-red-500 rounded-full transition-all duration-300 shadow-inner" />
                      <div className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-md transition-all transform ${form.category === "non-veg" ? "translate-x-4" : ""}`} />
                    </label>
                    <span className={`text-sm font-medium ${form.category === "non-veg" ? "text-red-600" : "text-gray-400"}`}>
                      <div className="badge-container non-veg-badge-container"><div className="triangle" /></div>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 select-none">
                    <span>Available</span>
                    <div style={toggleStyles.switch} onClick={() => setForm({ ...form, available: !form.available })}>
                      <input type="checkbox" checked={form.available} readOnly style={toggleStyles.input} />
                      <span style={{ ...toggleStyles.slider, ...(form.available ? { backgroundColor: "#F59E0B" } : {}) }} aria-hidden="true">
                        <span style={{ ...toggleStyles.sliderBefore, transform: form.available ? "translateX(18px)" : "translateX(0)" }} />
                      </span>
                    </div>
                  </div>

                  <button className="flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2 rounded w-full hover:bg-amber-700">
                    <span> <FaPlus /> </span> Add Menu Item
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right: Scrollable Menu Section */}
          <div className="flex-1 overflow-y-auto pt-10 border-2 border-amber-400 border-t-0 rounded-lg  bg-gray-50">
            {/* Menu Items Container */}
            <div className="pt-5 p-6 md:pt-0">
              <div className="mb-6 ">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <div className="absolute right-3 top-3 text-gray-400">
                    <FaSearch />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                {/* categories */}
                <div className="flex items-center justify-between md:justify-center mb-4  border-b border-amber-300 pb-3">
                  <div className="flex items-center md:justify-center gap-2 ">
                    <MdOutlineRestaurantMenu className="text-amber-600 text-2xl" />
                    <h1 className="text-2xl font-bold text-amber-600">Menu</h1>
                  </div>

                  {/* Add Item Button for Mobile */}
                  <div className="flex justify-center mb-0 md:hidden">
                    <button
                      onClick={handleAddItem}
                      className="bg-amber-600 text-white px-4 py-2 rounded w-0.5/2 hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaPlus /> Add Item
                    </button>
                  </div>
                </div>

                {/* categories veg and non-veg */}
                <div className="flex justify-end m-0 gap-2">
                  <button onClick={() => handleCategoryChange("all")} className="p-1 rounded-full ...">
                    {/* All Icon */}
                    <div className="rounded-sm border-gray-500 border-2 h-5 w-5 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-600 rounded-full" />
                    </div>

                  </button>

                  <button onClick={() => handleCategoryChange("veg")} className="p-1 rounded-full ...">
                    {/* Veg Icon */}
                    <div className="veg-badge-container rounded-full border-green-600 border-2 h-5 w-5 flex items-center justify-center">
                      <div className="circle bg-green-600 h-3 w-3 rounded-full" />
                    </div>

                  </button>

                  <button onClick={() => handleCategoryChange("non-veg")} className="p-1 rounded-full ...">
                    {/* Non-Veg Icon */}
                    <div className="non-veg-badge-container rounded-sm border-red-500 border-2 h-5 w-5 flex items-center justify-center">
                      <div className="triangle w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-red-600" />
                    </div>

                  </button>

                </div>
                {filteredItems.map((item) => (
                  <div key={item._id} className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {item.category === "veg" ? (
                          <div className="veg-badge-container rounded-full border-green-600 border-2 h-5 w-5 flex items-center justify-center">
                            <div className="circle bg-green-600 h-3 w-3 rounded-full" />
                          </div>
                        ) : (
                          <div className="non-veg-badge-container rounded-sm border-red-500 border-2 h-5 w-5 flex items-center justify-center">
                            <div className="triangle w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-red-600" />
                          </div>
                        )}
                        <h3 className="text-md font-semibold">{item.name}</h3>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded-full ${item.available ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                        {item.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">{item.description}</p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-amber-600 font-bold text-lg">₹{item.price}</span>
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 select-none">
                          <span className="text-sm text-gray-600">Available</span>
                          <div style={toggleStyles.switch}>
                            <input type="checkbox" checked={item.available} onChange={() => toggleAvailability(item)} style={toggleStyles.input} />
                            <span style={{ ...toggleStyles.slider, ...(item.available ? { backgroundColor: "#F59E0B" } : {}) }}>
                              <span style={{ ...toggleStyles.sliderBefore, transform: item.available ? "translateX(18px)" : "translateX(0)" }} />
                            </span>
                          </div>
                        </label>
                        <button onClick={() => handleEdit(item)} className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
                          <FaEdit className="text-blue-600 text-lg" />

                        </button>
                        <button onClick={() => handleDelete(item._id)} className="flex items-center gap-2 text-red-600 hover:underline text-sm">
                          <FaTrash className="text-red-600 text-lg" />

                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div >

          {/* Modal for Edit */}
          {
            editItem && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative">
                  <button onClick={() => { setEditItem(null); setForm({ name: "", description: "", price: "", available: true, category: "veg" }); }} className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl">×</button>
                  <h2 className="text-xl font-bold mb-4">Edit: {editItem.name}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-2 w-full rounded" required />
                    <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border p-2 w-full rounded" />
                    <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border p-2 w-full rounded" required />

                    <div className="flex items-center space-x-3 mt-3">
                      <span className={`text-sm font-medium ${form.category === "veg" ? "text-green-600" : "text-gray-400"}`}>
                        <div className="badge-container veg-badge-container"><div className="circle" /></div>
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={form.category === "non-veg"} onChange={() => setForm({ ...form, category: form.category === "veg" ? "non-veg" : "veg" })} />
                        <div className="w-10 h-6 bg-gray-200 peer-checked:bg-red-500 rounded-full transition-all duration-300 shadow-inner" />
                        <div className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-md transition-all transform ${form.category === "non-veg" ? "translate-x-4" : ""}`} />
                      </label>
                      <span className={`text-sm font-medium ${form.category === "non-veg" ? "text-red-600" : "text-gray-400"}`}>
                        <div className="badge-container non-veg-badge-container"><div className="triangle" /></div>
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span>Available</span>
                      <div style={toggleStyles.switch} onClick={() => setForm({ ...form, available: !form.available })}>
                        <input type="checkbox" checked={form.available} readOnly style={toggleStyles.input} />
                        <span style={{ ...toggleStyles.slider, ...(form.available ? { backgroundColor: "#F59E0B" } : {}) }} aria-hidden="true">
                          <span style={{ ...toggleStyles.sliderBefore, transform: form.available ? "translateX(18px)" : "translateX(0)" }} />
                        </span>
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes </button>
                  </form>
                </div>
              </div>
            )
          }
        </div >
      </div >
    </>
  );
}
