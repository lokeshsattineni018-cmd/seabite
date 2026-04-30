import { motion } from "framer-motion";
import { FiPackage, FiShoppingCart, FiClock, FiDollarSign, FiArrowRight } from "react-icons/fi";

export default function Customer360Sidebar({ context, loading }) {
    if (loading) return (
        <div className="w-80 h-full border-l border-stone-100 p-6 space-y-6">
            <div className="h-4 bg-stone-100 rounded w-1/2 animate-pulse" />
            <div className="h-32 bg-stone-100 rounded-3xl animate-pulse" />
            <div className="h-32 bg-stone-100 rounded-3xl animate-pulse" />
        </div>
    );

    if (!context) return (
        <div className="w-80 h-full border-l border-stone-100 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mb-4">
                <FiPackage size={24} />
            </div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">No Profile Found</p>
            <p className="text-[10px] text-stone-500">This user hasn't created a SeaBite account yet.</p>
        </div>
    );

    const { user, recentOrders } = context;

    return (
        <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-80 h-full border-l border-stone-100 overflow-y-auto custom-scrollbar"
        >
            <div className="p-6 space-y-8">
                {/* Wallet & Points */}
                {user && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Customer Context</p>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <FiDollarSign size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Wallet Balance</p>
                                    <h4 className="text-lg font-bold text-emerald-900">₹{user.walletBalance || 0}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cart Peek */}
                {user?.cart?.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                            <FiShoppingCart size={12} /> Active Cart Peek
                        </p>
                        <div className="bg-white border border-stone-100 rounded-3xl p-4 space-y-3 shadow-sm">
                            {user.cart.slice(0, 3).map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <img src={item.product?.image} className="w-10 h-10 rounded-lg object-cover bg-stone-50" />
                                    <div className="flex-1">
                                        <p className="text-[11px] font-bold text-stone-900 truncate">{item.product?.name}</p>
                                        <p className="text-[10px] text-stone-500">{item.qty} units sitting in cart</p>
                                    </div>
                                </div>
                            ))}
                            {user.cart.length > 3 && (
                                <p className="text-[10px] text-center text-stone-400">+{user.cart.length - 3} more items</p>
                            )}
                            <button className="w-full py-2 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                                nudge to checkout <FiArrowRight size={10} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Recent Orders */}
                <div className="space-y-4">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                        <FiClock size={12} /> Recent Orders
                    </p>
                    <div className="space-y-3">
                        {recentOrders.length === 0 ? (
                            <p className="text-[10px] text-stone-400 italic">No purchase history yet.</p>
                        ) : (
                            recentOrders.map((order, i) => (
                                <div key={i} className="p-4 bg-stone-50/50 border border-stone-100 rounded-2xl">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[11px] font-bold text-stone-900">Order #{order.orderId}</p>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                                            order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 
                                            order.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-stone-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    <div className="mt-2 flex items-center gap-1">
                                        {order.items.slice(0, 2).map((item, j) => (
                                            <div key={j} className="px-1.5 py-0.5 bg-white border border-stone-100 rounded text-[9px] font-medium text-stone-600 truncate max-w-[80px]">
                                                {item.name}
                                            </div>
                                        ))}
                                        {order.items.length > 2 && <span className="text-[9px] text-stone-400">+{order.items.length - 2}</span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
