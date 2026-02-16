import { useState, useEffect } from "react";
import {
    DndContext,
    closestCorners,
    useSensor,
    useSensors,
    PointerSensor,
    DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiCheckCircle, FiTruck, FiPackage, FiMoreHorizontal } from "react-icons/fi";
import toast from "react-hot-toast";

const COLUMNS = [
    { id: "Pending", title: "Pending", color: "bg-amber-50 text-amber-900 border-amber-200", icon: <FiClock /> },
    { id: "Processing", title: "Processing", color: "bg-blue-50 text-blue-900 border-blue-200", icon: <FiPackage /> },
    { id: "Shipped", title: "Shipped", color: "bg-indigo-50 text-indigo-900 border-indigo-200", icon: <FiTruck /> },
    { id: "Delivered", title: "Delivered", color: "bg-emerald-50 text-emerald-900 border-emerald-200", icon: <FiCheckCircle /> },
];

export default function AdminKanban() {
    const [orders, setOrders] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get("/api/orders", { withCredentials: true });
            // Filter out cancelled orders for Kanban flow
            const activeOrders = res.data.filter(o => !o.status.includes("Cancelled"));
            setOrders(activeOrders);
            setLoading(false);
        } catch (err) {
            toast.error("Failed to load orders");
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`/api/orders/${orderId}/status`, { status: newStatus }, { withCredentials: true });
            toast.success(`Order migrated to ${newStatus}`);
        } catch (err) {
            toast.error("Update failed");
            fetchOrders(); // Revert on failure
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }, // Prevent accidental drags
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeOrder = orders.find((o) => o._id === active.id);
        const overId = over.id; // This will be the column status (e.g., "Shipped")

        if (!activeOrder) return;

        // If dropped on a column container
        if (COLUMNS.find(c => c.id === overId)) {
            if (activeOrder.status !== overId) {
                // Optimistic update
                setOrders((prev) =>
                    prev.map((o) => (o._id === activeOrder._id ? { ...o, status: overId } : o))
                );
                updateOrderStatus(activeOrder._id, overId);
            }
        }
    };

    // Group orders by status
    const boardData = COLUMNS.reduce((acc, col) => {
        acc[col.id] = orders.filter((o) => o.status === col.id);
        return acc;
    }, {});

    if (loading) return <div className="p-10 text-center text-slate-400">Loading Board...</div>;

    return (
        <div className="p-6 h-[calc(100vh-60px)] overflow-x-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Order Workflow</h1>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-6 h-full min-w-[1000px]">
                    {COLUMNS.map((col) => (
                        <KanbanColumn key={col.id} column={col} orders={boardData[col.id] || []} />
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <OrderCard order={orders.find(o => o._id === activeId)} isOverlay />
                    ) : null}
                </DragOverlay>

            </DndContext>
        </div>
    );
}

function KanbanColumn({ column, orders }) {
    const { setNodeRef } = useSortable({ id: column.id });

    return (
        <div
            ref={setNodeRef}
            className="flex-1 min-w-[280px] flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200/60 max-h-full"
        >
            {/* Header */}
            <div className={`p-4 rounded-t-2xl border-b border-slate-200 flex justify-between items-center ${column.color} bg-opacity-40`}>
                <div className="flex items-center gap-2 font-bold">
                    {column.icon}
                    <span>{column.title}</span>
                </div>
                <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                    {orders.length}
                </span>
            </div>

            {/* Droppable Area */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
                <SortableContext
                    items={orders.map((o) => o._id)}
                    strategy={verticalListSortingStrategy}
                >
                    {orders.map((order) => (
                        <SortableOrderCard key={order._id} order={order} />
                    ))}
                </SortableContext>
                {orders.length === 0 && (
                    <div className="h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium">
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}

function SortableOrderCard({ order }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: order._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <OrderCard order={order} />
        </div>
    );
}

function OrderCard({ order, isOverlay }) {
    return (
        <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isOverlay ? 'shadow-xl rotate-2 scale-105' : ''}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-mono text-slate-400">#{order.orderId || order._id.slice(-6)}</span>
                <span className="font-bold text-xs text-emerald-600">₹{order.totalAmount}</span>
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">{order.user?.name || "Guest User"}</h4>
            <div className="text-xs text-slate-500 mb-3 line-clamp-2">
                {order.items.map(i => `${i.qty}x ${i.name}`).join(", ")}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <span className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                <FiMoreHorizontal className="text-slate-300" />
            </div>
        </div>
    )
}
