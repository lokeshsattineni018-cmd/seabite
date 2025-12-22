import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to resolve __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define storage settings
const storage = multer.diskStorage({
  // Destination where files will be saved (e.g., /server/public/uploads)
  destination: function (req, file, cb) {
    // You might need to adjust this path based on your exact folder structure
    cb(null, path.join(__dirname, '../public/uploads/')); 
  },
  // Filename settings
  filename: function (req, file, cb) {
    // Create a unique name: e.g., product-1678888888888.jpg
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});

// Configure Multer
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit files size to 5MB (optional)
});

export default upload;