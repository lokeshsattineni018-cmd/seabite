import { createContext, useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

// 1. Export the Context itself
export const CartContext = createContext();

// Function to calculate totals from the cart array (kept outside Provider)
// Function to calculate totals
const calculateTotals = (cart, globalDiscount = 0, settings = {}) => {
    let subtotal = 0;
    let count = 0;

    const updatedCart = cart.map(item => {
        let price = parseFloat(item.basePrice);
        if (isNaN(price)) price = parseFloat(item.price) || 0;

        const isFlashSale = item.flashSale?.isFlashSale && new Date(item.flashSale.saleEndDate) > new Date();

        if (isFlashSale) {
            price = parseFloat(item.flashSale.discountPrice);
        } else if (globalDiscount > 0) {
            price = Math.round(price * (1 - globalDiscount / 100));
        }

        const qty = Number(item.qty || 1);

        if (!isNaN(price) && !isNaN(qty)) {
            subtotal += price * qty;
            count += qty;
        }

        return { ...item, price };
    });

    // Dynamic Settings with defaults
    const taxRate = settings.taxRate !== undefined ? settings.taxRate / 100 : 0.05;
    const deliveryFee = settings.deliveryFee !== undefined ? settings.deliveryFee : 99;
    const freeDeliveryThreshold = settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 1000;

    const deliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : deliveryFee;
    const tax = Math.round(subtotal * taxRate);
    const grandTotal = subtotal + tax + deliveryCharge;

    return {
        cartItems: updatedCart,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        deliveryFee: deliveryCharge.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        cartCount: count,
        globalDiscount,
    };
};

export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cartState, setCartState] = useState({
        cartItems: [],
        cartCount: 0,
        subtotal: '0.00',
        grandTotal: '0.00',
        tax: '0.00',
        deliveryFee: '0.00',
        globalDiscount: 0,
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [cartLoaded, setCartLoaded] = useState(false);

    const [storeSettings, setStoreSettings] = useState({
        taxRate: 5,
        deliveryFee: 99,
        freeDeliveryThreshold: 1000
    });
    const [globalDiscount, setGlobalDiscount] = useState(0);

    // Fetch Global Settings & Discount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // 1. Fetch Public Settings
                const settingsRes = await axios.get(`${API_URL}/api/settings`);
                setStoreSettings(settingsRes.data);

                // 2. Fetch Global Discount (if not in settings, check products/logic)
                // The new settings route includes globalDiscount, so we can use that!
                if (settingsRes.data.globalDiscount !== undefined) {
                    setGlobalDiscount(settingsRes.data.globalDiscount);
                } else {
                    // Fallback to old method just in case
                    const res = await axios.get(`${API_URL}/api/products?limit=1`);
                    if (res.data.globalDiscount) setGlobalDiscount(res.data.globalDiscount);
                }
            } catch (err) {
                // console.error(err);
            }
        };
        fetchSettings();
    }, []);

    const updateCartState = useCallback(() => {
        try {
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            const totals = calculateTotals(cart, globalDiscount, storeSettings); // Pass settings
            setCartState(totals);
        } catch (e) {
            // console.error(e);
        }
    }, [globalDiscount, storeSettings]);

    const refreshCartCount = updateCartState;

    useEffect(() => {
        updateCartState();
        window.addEventListener("storage", updateCartState);
        return () => window.removeEventListener("storage", updateCartState);
    }, [updateCartState]);

    useEffect(() => {
        if (!user) return;
        const syncCart = async () => {
            const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
            if (localCart.length === 0) {
                try {
                    const res = await axios.get(`${API_URL}/api/user/cart`, { withCredentials: true });
                    if (res.data && res.data.length > 0) {
                        const dbCart = res.data
                            .filter(item => item && item.product)
                            .map(item => ({
                                ...item.product,
                                qty: item.qty,
                                price: item.product.price || item.product.basePrice
                            }));
                        localStorage.setItem("cart", JSON.stringify(dbCart));
                        updateCartState();
                    }
                } catch (err) { }
            } else {
                try {
                    const payload = localCart
                        .filter(item => item && item._id)
                        .map(item => ({ product: item._id, qty: item.qty }));
                    await axios.post(`${API_URL}/api/user/cart`, { cart: payload }, { withCredentials: true });
                } catch (err) { }
            }
            setCartLoaded(true);
        };
        syncCart();
    }, [user, updateCartState]);

    useEffect(() => {
        if (!user) return;
        const timeout = setTimeout(async () => {
            const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
            try {
                const payload = localCart
                    .filter(item => item && item._id)
                    .map(item => ({ product: item._id, qty: item.qty }));
                await axios.post(`${API_URL}/api/user/cart`, { cart: payload }, { withCredentials: true });
            } catch (err) { }
        }, 2000);
        return () => clearTimeout(timeout);
    }, [cartState, user]);

    const addToCart = (product) => {
        try {
            const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
            const existingItemIndex = currentCart.findIndex((item) => item._id === product._id);
            if (existingItemIndex > -1) {
                currentCart[existingItemIndex].qty += product.quantity || 1;
            } else {
                let finalPrice = parseFloat(product.price);
                if (isNaN(finalPrice)) finalPrice = parseFloat(product.basePrice);
                if (isNaN(finalPrice)) finalPrice = 0;
                currentCart.push({ ...product, qty: product.quantity || 1, price: finalPrice });
            }
            localStorage.setItem("cart", JSON.stringify(currentCart));
            updateCartState();
            window.dispatchEvent(new Event("storage"));
        } catch (error) { }
    };

    const removeFromCart = (productId) => {
        try {
            const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
            const updatedCart = currentCart.filter((item) => item._id !== productId);
            localStorage.setItem("cart", JSON.stringify(updatedCart));
            updateCartState();
            window.dispatchEvent(new Event("storage"));
        } catch (error) { }
    };

    const updateQuantity = (productId, newQty) => {
        try {
            if (newQty < 1) return;
            const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
            const itemIndex = currentCart.findIndex((item) => item._id === productId);
            if (itemIndex > -1) {
                currentCart[itemIndex].qty = newQty;
                localStorage.setItem("cart", JSON.stringify(currentCart));
                updateCartState();
                window.dispatchEvent(new Event("storage"));
            }
        } catch (error) { }
    };

    const clearCart = () => {
        localStorage.removeItem("cart");
        updateCartState();
        window.dispatchEvent(new Event("storage"));
    };

    const contextValue = {
        ...cartState,
        storeSettings, // 🟢 Expose Settings
        refreshCartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartLoaded,
        cartItems: cartState.cartItems
    };

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};