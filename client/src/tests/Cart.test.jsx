import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CartSidebar from '../components/layout/CartSidebar';
import { CartContext } from '../context/CartContext';
import { ThemeContext } from '../context/ThemeContext';
import { BrowserRouter } from 'react-router-dom';

// Mock Framer Motion to avoid animation issues in test
vi.mock('framer-motion', () => {
    const motion = new Proxy(
        {},
        {
            get: (target, prop) => {
                return ({ children, style, ...props }) => {
                    const Tag = prop;
                    return <Tag style={style} {...props}>{children}</Tag>;
                };
            },
        }
    );
    return {
        motion,
        AnimatePresence: ({ children }) => <>{children}</>,
    };
});

describe('CartSidebar UI', () => {
    it('renders "empty cart" message when no items', () => {
        const mockContext = {
            cartCount: 0,
            refreshCartCount: vi.fn(),
            cartItems: [],
            subtotal: "0.00",
            storeSettings: { freeDeliveryThreshold: 1000 },
            isCartOpen: true,
            setIsCartOpen: vi.fn(),
            addToCart: vi.fn(),
            removeFromCart: vi.fn(),
        };

        render(
            <ThemeContext.Provider value={{ isDarkMode: false }}>
                <CartContext.Provider value={mockContext}>
                    <BrowserRouter>
                        <CartSidebar onClose={vi.fn()} />
                    </BrowserRouter>
                </CartContext.Provider>
            </ThemeContext.Provider>
        );

        expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    });

    it('renders items and subtotal', () => {
        const mockContext = {
            cartCount: 2,
            refreshCartCount: vi.fn(),
            cartItems: [
                { _id: '1', name: 'Fresh Tuna', price: 200, qty: 2, image: '/tuna.jpg', selectedCut: 'Fillet', orderedWeightGrams: 500 }
            ],
            subtotal: "400.00",
            storeSettings: { freeDeliveryThreshold: 1000 },
            isCartOpen: true,
            setIsCartOpen: vi.fn(),
            addToCart: vi.fn(),
            removeFromCart: vi.fn(),
        };

        render(
            <ThemeContext.Provider value={{ isDarkMode: false }}>
                <CartContext.Provider value={mockContext}>
                    <BrowserRouter>
                        <CartSidebar onClose={vi.fn()} />
                    </BrowserRouter>
                </CartContext.Provider>
            </ThemeContext.Provider>
        );

        expect(screen.getByText('Fresh Tuna')).toBeInTheDocument();
        expect(screen.getAllByText('₹400')[0]).toBeInTheDocument();
    });
});
