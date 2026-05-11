import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';
import { tokens } from '../../utils/design-tokens';

const API_URL = import.meta.env.VITE_API_URL || "";

const RecommendationBlock = ({ currentProductId, category, title = "Recommended for You" }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalDiscount, setGlobalDiscount] = useState(0);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // We use the category to fetch similar products
        const res = await axios.get(`${API_URL}/api/products`, {
          params: { category, limit: 4 }
        });
        
        // Filter out the current product
        const filtered = (res.data.products || res.data)
          .filter(p => p._id !== currentProductId)
          .slice(0, 4);
          
        setRecommendations(filtered);
        // Save global discount if available
        if (res.data.globalDiscount !== undefined) {
          setGlobalDiscount(res.data.globalDiscount);
        }
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
      } finally {
        setLoading(false);
      }
    };

    if (category) fetchRecommendations();
  }, [currentProductId, category]);

  if (loading || recommendations.length === 0) return null;

  return (
    <section 
      aria-labelledby="recommendation-title"
      style={{ 
        marginTop: tokens.spacing.xl, 
        paddingTop: tokens.spacing.lg,
        borderTop: `1px solid rgba(0,0,0,0.05)` 
      }}
    >
      <h2 
        id="recommendation-title"
        style={{ 
          color: tokens.colors.primarySea, 
          fontSize: tokens.typography.scales.h3,
          fontWeight: tokens.typography.weights.bold,
          marginBottom: tokens.spacing.lg,
          fontFamily: tokens.typography.fontFamily
        }}
      >
        {title}
      </h2>
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", 
          gap: tokens.spacing.md 
        }}
      >
        {recommendations.map(product => (
          <ProductCard key={product._id} product={product} globalDiscount={globalDiscount} />
        ))}
      </div>
    </section>
  );
};

export default RecommendationBlock;
