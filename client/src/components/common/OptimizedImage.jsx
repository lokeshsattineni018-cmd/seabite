import { useState } from "react";
import { optimizeImage, blurPlaceholder } from "../../utils/cloudinaryOptimize";

export default function OptimizedImage({
  src,
  alt = "",
  width = 400,
  className = "",
  style = {},
  priority = false,
  onClick,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const optimizedSrc = optimizeImage(src, { width });
  const placeholderSrc = blurPlaceholder(src);

  const fallback = "https://placehold.co/400?text=SeaBite";

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ ...style, position: "relative" }}
      onClick={onClick}
    >
      {/* Blur placeholder for Cloudinary images while loading */}
      {!loaded && !error && src?.includes("res.cloudinary.com") && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-105 pointer-events-none"
        />
      )}

      {/* Main Image */}
      <img
        src={error ? fallback : optimizedSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        {...props}
      />
    </div>
  );
}
