"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export default function OrderViewer({ userId, tableNumber, isOpen, onClose }) {
    const [orders, setOrders] = useState([]);
    const [cart, setCart] = useState([]);
    const [itemQuantities, setItemQuantities] = useState({});
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadCart();
        }
    }, [isOpen]);

    const loadCart = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/order/active?userId=${userId}&tableNumber=${tableNumber}`);
            const data = await res.json();

            if (res.ok && data.orders) {
                if (data.orders.length === 0) {
                    // No active orders
                    setOrders([]);
                    const stored = localStorage.getItem("cart");
                    if (stored) {
                        const storedCart = JSON.parse(stored);
                        const formattedCart = storedCart.map(item => ({
                            menuItemId: item.menuItemId,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            notes: item.notes || ''
                        }));
                        setCart(formattedCart);
                    }
                } else {
                    // Load all active orders
                    setOrders(
                        data.orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                      );
                      

                    const currentOrder = data.orders[0]; // assume latest one for cart
                    const formattedItems = currentOrder.items.map(item => ({
                        menuItemId: item.menuItemId,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        notes: item.notes || ''
                    }));
                    setCart(formattedItems);
                    setOrderPlaced(true);
                }
            }
        } catch (err) {
            console.error("Failed to load active order", err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className={`fixed inset-0 z-50 ${isOpen ? "flex" : "hidden"} items-center justify-center bg-black/50`}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-lg w-[90%] max-w-2xl p-6 shadow-xl"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Your Orders</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <FaTimes size={24} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No orders found</div>
                    ) : (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {orders.map((order, index) => (
                                <div key={order.id || index} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold">Order #{index + 1}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 rounded text-sm ${order.status === "completed"
                                                ? "bg-green-100 text-green-800"
                                                : order.status === "cancelled"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-blue-100 text-blue-800"
                                                }`}
                                        >
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {order.items.map((item) => (
                                            <div key={item.menuItemId || item.name} className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block">₹{item.price} x {item.quantity}</span>
                                                    {/* <span className="font-semibold">₹{item.price * item.quantity}</span> */}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 border-t pt-3 flex justify-between items-center">
                                        <span className="font-semibold">Total:</span>
                                        <span className="font-bold">₹{order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)}</span>
                                    </div>
                                    
                                </div>
                            ))}
                            {orders.length > 0 && (
                        <div className="mt-4 border-t pt-4 flex justify-between font-bold text-lg">
                            <span>Grand Total:</span>
                            <span>
                                ₹{orders.reduce((sum, order) =>
                                    sum + order.items.reduce((sub, item) => sub + item.price * item.quantity, 0)
                                    , 0)}
                            </span>
                        </div>
                    )}
                        </div>

                    )}

                    {/* {orders.length > 0 && (
                        <div className="mt-4 border-t pt-4 flex justify-between font-bold text-lg">
                            <span>Grand Total:</span>
                            <span>
                                ₹{orders.reduce((sum, order) =>
                                    sum + order.items.reduce((sub, item) => sub + item.price * item.quantity, 0)
                                    , 0)}
                            </span>
                        </div>
                    )} */}
                </motion.div>
            </motion.div>
        </>
    );

}
