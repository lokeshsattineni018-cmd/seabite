import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Cart from '../pages/shop/Cart';
import { CartContext } from '../context/CartContext';
import { ThemeContext } from '../context/ThemeContext';
import { BrowserRouter } from 'react-router-dom';

// Mock Framer Motion to avoid animation issues in test
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
        button: ({ children, ...props }) => <button {...props}>{children}</button>,
        span: ({ children, ...props }) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock PopupModal
vi.mock('../../components/common/PopupModal', () => ({
    default: () => <div data-testid="popup-modal">Popup</div>,
}));

describe('Cart UI', () => {
    it('renders "empty cart" message when no items', () => {
        const mockContext = {
            cartItems: [], // Empty
            removeFromCart: vi.fn(),
            updateQuantity: vi.fn(),
            deliveryFee: 0,
            tax: 0,
            grandTotal: 0,
            subtotal: 0,
        };

        render(
            <ThemeContext.Provider value={{ isDarkMode: false }}>
                <CartContext.Provider value={mockContext}>
                    <BrowserRouter>
                        <Cart open={true} onClose={vi.fn()} />
                    </BrowserRouter>
                </CartContext.Provider>
            </ThemeContext.Provider>
        );

        expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    });

    it('renders items and dynamic fees', () => {
        const mockContext = {
            cartItems: [
                { _id: '1', name: 'Fresh Tuna', price: 200, qty: 2, image: '/tuna.jpg' }
            ],
            removeFromCart: vi.fn(),
            updateQuantity: vi.fn(),
            deliveryFee: 50,
            tax: 20,
            grandTotal: 470, // 400 + 50 + 20
            subtotal: 400,
        };

        render(
            <ThemeContext.Provider value={{ isDarkMode: false }}>
                <CartContext.Provider value={mockContext}>
                    <BrowserRouter>
                        <Cart open={true} onClose={vi.fn()} />
                    </BrowserRouter>
                </CartContext.Provider>
            </ThemeContext.Provider>
        );

        expect(screen.getByText('Fresh Tuna')).toBeInTheDocument();
        expect(screen.getByText('₹400')).toBeInTheDocument(); // Subtotal
        expect(screen.getByText('₹50')).toBeInTheDocument(); // Delivery Fee
        expect(screen.getByText('₹20')).toBeInTheDocument(); // Tax
        expect(screen.getByText('₹470')).toBeInTheDocument(); // Grand Total
    });
});
