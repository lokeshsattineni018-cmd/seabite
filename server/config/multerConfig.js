import multer from 'multer';

// ✅ FIXED FOR VERCEL: Use Memory Storage
// Vercel does not have a hard drive to save files to (read-only).
// We must use memoryStorage() to keep the file in RAM temporarily.
const storage = multer.memoryStorage();

// Configure Multer
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit files size to 5MB
});

export default upload;