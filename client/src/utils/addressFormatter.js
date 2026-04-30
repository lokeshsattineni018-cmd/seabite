/**
 * Clean up address strings by removing duplicate words (like city names)
 * and trailing/leading commas/whitespace.
 */
export const formatAddress = (addr) => {
  if (!addr) return "";
  
  // Example: "bhimavaram, bhimavaram" -> ["bhimavaram", "bhimavaram"]
  const parts = addr.split(",").map(p => p.trim()).filter(p => p !== "");
  
  // Use a Set to unique-ify the parts, case-insensitively
  const uniqueParts = [];
  const seen = new Set();
  
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (!seen.has(lower)) {
      uniqueParts.push(part);
      seen.add(lower);
    }
  }
  
  return uniqueParts.join(", ");
};
