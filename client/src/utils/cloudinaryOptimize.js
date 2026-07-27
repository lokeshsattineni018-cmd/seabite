/**
 * Transforms Cloudinary URLs to serve optimized WebP/AVIF images with width scaling
 * @param {string} url - Image URL
 * @param {object} options - { width, quality, format }
 * @returns {string} Optimized image URL
 */
export const optimizeImage = (url, { width = 400, quality = "auto", format = "auto" } = {}) => {
  if (!url || typeof url !== "string") return url || "";
  if (!url.includes("res.cloudinary.com")) return url;

  const transform = `f_${format},q_${quality},w_${width},c_limit`;

  // Handle /upload/ and /upload/v12345/ patterns
  if (url.includes("/upload/v")) {
    return url.replace(/\/upload\/v\d+\//, `/upload/${transform}/`);
  }
  return url.replace("/upload/", `/upload/${transform}/`);
};

export const blurPlaceholder = (url) => {
  if (!url || typeof url !== "string") return url || "";
  if (!url.includes("res.cloudinary.com")) return url;
  const transform = "f_auto,q_10,w_30,e_blur:400";
  if (url.includes("/upload/v")) {
    return url.replace(/\/upload\/v\d+\//, `/upload/${transform}/`);
  }
  return url.replace("/upload/", `/upload/${transform}/`);
};
