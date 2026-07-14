/**
 * 🛡️ Image Magic Bytes Validator Middleware
 * Enforces actual file signature verification to prevent spoofed/malicious file uploads.
 */
export const validateFileSignatures = (req, res, next) => {
  const checkBuffer = (buffer) => {
    if (!buffer || buffer.length < 4) return false;
    
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return true;
    }
    
    // JPEG/JPG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }
    
    // GIF: 47 49 46 38 ("GIF8")
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return true;
    }
    
    // WEBP: RIFF (52 49 46 46) + WEBP (57 45 42 50)
    if (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      return true;
    }
    
    return false;
  };

  const files = [];
  if (req.file) files.push(req.file);
  
  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      // Field-based uploads (e.g. upload.fields)
      Object.keys(req.files).forEach(field => {
        if (Array.isArray(req.files[field])) {
          files.push(...req.files[field]);
        }
      });
    }
  }

  for (const file of files) {
    if (!checkBuffer(file.buffer)) {
      console.warn(`🚨 [SECURITY ALERT] User ${req.user?._id || "unknown"} attempted uploading a file with spoofed signature: ${file.originalname}`);
      return res.status(400).json({ 
        message: `Security violation: The file "${file.originalname}" is not a valid image format (JPEG, PNG, GIF, or WEBP).` 
      });
    }
  }

  next();
};
