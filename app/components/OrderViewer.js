"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

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
            const res = await fetch(`/api/order/all?userId=${userId}&tableNumber=${tableNumber}`);
            const data = await res.json();

            if (res.ok && data.orders) {
                if (data.orders.length === 0) {
                    // No orders found
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
                    // Set orders data
                    setOrders(data.orders || []);

                    // Don't automatically set cart from orders - let user manage their current cart
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
                }
            } else {
                setOrders([]);
            }
        } catch (error) {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
            case 'cancelled':
                return <XCircleIcon className="w-4 h-4 text-red-600" />;
            default:
                return <ClockIcon className="w-4 h-4 text-amber-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-50 text-green-800 border-green-200';
            case 'cancelled':
                return 'bg-red-50 text-red-800 border-red-200';
            case 'served':
                return 'bg-purple-50 text-purple-800 border-purple-200';
            case 'ready':
                return 'bg-blue-50 text-blue-800 border-blue-200';
            case 'preparing':
                return 'bg-orange-50 text-orange-800 border-orange-200';
            default:
                return 'bg-amber-50 text-amber-800 border-amber-200';
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white rounded-2xl w-[90%] max-w-2xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-white">My Orders</h2>
                                <p className="text-amber-100 text-sm">Table {tableNumber}</p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="text-white hover:text-amber-100 p-2 hover:bg-white/20 rounded-full transition-all duration-200"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {loading ? (
                            <div className="flex flex-col justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-500 mb-4"></div>
                                <p className="text-gray-600">Loading your orders...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">No orders yet</h3>
                                <p className="text-gray-500">Start browsing our menu to place your first order!</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 mb-4">
                                    {orders.map((order, orderIndex) => (
                                        <div key={order._id || order.id || `order-${orderIndex}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                                            {/* Order Header */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                                        Order #{orderIndex + 1}
                                                        {getStatusIcon(order.status)}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(order.createdAt).toLocaleString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                </span>
                                            </div>

                                            {/* Order Items */}
                                            <div className="space-y-2 mb-3">
                                                {order.items.map((item, itemIndex) => (
                                                    <div key={`${order._id || order.id || orderIndex}-${item.menuItemId || item._id || itemIndex}-${itemIndex}`} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                                        <div className="flex-1">
                                                            <span className="font-medium text-gray-800">{item.name}</span>
                                                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                                                <span>Qty: {item.quantity}</span>
                                                                {item.size && <span>• Size: {item.size}</span>}
                                                                {item.notes && <span>• Note: {item.notes}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <div className="text-sm text-gray-600">₹{item.price} × {item.quantity}</div>
                                                            <div className="font-semibold text-amber-600">₹{(item.price * item.quantity).toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Order Total */}
                                            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                                <span className="font-semibold text-gray-800">Order Total:</span>
                                                <span className="font-bold text-lg text-amber-600">
                                                    ₹{order.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Fixed Grand Total */}
                                {orders.length > 0 && (
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 sticky bottom-0">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-lg text-gray-800">Grand Total:</span>
                                            <span className="font-bold text-xl text-amber-600">
                                                ₹{orders.reduce((sum, order) =>
                                                    sum + order.items.reduce((sub, item) => sub + item.price * item.quantity, 0)
                                                    , 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}
