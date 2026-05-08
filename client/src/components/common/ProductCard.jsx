// client/src/components/common/ProductCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { FiShoppingCart } from "react-icons/fi";
import { tokens } from "../../utils/design-tokens";

/**
 * SeaBite Product Card Component
 * Implements the new design system: primary-sea, accent-fresh, grayscale-background.
 */
const ProductCard = ({ product, onAddToCart }) => {
  const { colors, typography, spacing, shadows, borderRadius } = tokens;

  const getImageUrl = (path) => {
    if (!path) return "https://placehold.co/400?text=No+Image";
    if (path.startsWith("http")) return path;
    const API_URL = import.meta.env.VITE_API_URL || "";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return cleanPath.startsWith("/uploads")
      ? `${API_URL}${cleanPath}`
      : `${API_URL}/uploads${cleanPath}`;
  };

  // Formatting price to Indian Rupees
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: shadows.premium }}
      role="article"
      aria-label={`Product card for ${product.name}`}
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.subtle,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "all 0.2s ease-in-out",
        border: `1px solid rgba(0,0,0,0.05)`,
      }}
    >
      {/* Product Image Section */}
      <div
        style={{
          backgroundColor: colors.grayscaleBackground,
          height: "200px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.md,
          position: "relative",
        }}
      >
        <img
          src={getImageUrl(product.image)}
          alt={`Image of ${product.name}`}
          loading="lazy"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
        />
        {product.discount > 0 && (
          <div
            role="status"
            aria-label={`${product.discount} percent discount`}
            style={{
              position: "absolute",
              top: spacing.sm,
              right: spacing.sm,
              backgroundColor: colors.accentFresh,
              color: colors.white,
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: borderRadius.full,
              fontSize: typography.scales.small,
              fontWeight: typography.weights.bold,
            }}
          >
            {product.discount}% OFF
          </div>
        )}
      </div>

      {/* Product Info Section */}
      <div
        style={{
          padding: spacing.md,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <h3
          style={{
            color: colors.primarySea,
            fontSize: typography.scales.h4,
            fontWeight: typography.weights.bold,
            fontFamily: typography.fontFamily,
            margin: `0 0 ${spacing.sm} 0`,
            lineHeight: 1.2,
          }}
        >
          {product.name}
        </h3>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: spacing.sm,
            marginTop: "auto",
            marginBottom: spacing.md,
          }}
        >
          <span
            aria-label={`Price: ${formattedPrice}`}
            style={{
              color: colors.accentFresh,
              fontSize: typography.scales.h3,
              fontWeight: typography.weights.extrabold,
              fontFamily: typography.fontFamily,
            }}
          >
            {formattedPrice}
          </span>
          {product.oldPrice && (
            <span
              aria-label={`Original price: ₹${product.oldPrice}`}
              style={{
                color: "#6B7280",
                fontSize: typography.scales.small,
                textDecoration: "line-through",
              }}
            >
              ₹{product.oldPrice}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onAddToCart(product)}
          aria-label={`Add ${product.name} to cart`}
          style={{
            backgroundColor: colors.accentFresh,
            color: colors.white,
            border: "none",
            borderRadius: borderRadius.md,
            padding: `${spacing.sm} ${spacing.md}`,
            fontSize: typography.scales.body,
            fontWeight: typography.weights.bold,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            cursor: "pointer",
            width: "100%",
            transition: "opacity 0.2s",
          }}
        >
          <FiShoppingCart size={18} aria-hidden="true" />
          Add to Cart
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
