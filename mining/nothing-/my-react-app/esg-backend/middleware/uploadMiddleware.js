import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowed file extensions (security: prevent path traversal)
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Validate file extension against allowlist
const getValidExtension = (originalname) => {
    const sanitizedName = path.basename(originalname);
    const ext = path.extname(sanitizedName).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext) ? ext : '.jpg';
};

// Sanitize filename to prevent path traversal
const sanitizeFilename = (filename) => {
    // Remove any path separators and dangerous characters
    return path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_');
};

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        // Fixed destination - no user input involved (prevents path traversal)
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Sanitize user ID to prevent path traversal
        const safeUserId = String(req.user?.userId || 'unknown').replace(/[^a-zA-Z0-9]/g, '');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeExtension = getValidExtension(file.originalname);
        
        // Generate safe filename with no path traversal possibility
        const filename = `user-${safeUserId}-${uniqueSuffix}${safeExtension}`;
        cb(null, filename);
    }
});

// File filter (Images only)
const fileFilter = (_req, file, cb) => {
    // Validate MIME type and extension for security
    const isValidMimeType = file.mimetype.startsWith('image/');
    const sanitizedName = sanitizeFilename(file.originalname);
    const hasValidExtension = ALLOWED_EXTENSIONS.includes(path.extname(sanitizedName).toLowerCase());
    
    if (isValidMimeType && hasValidExtension) {
        cb(null, true);
    } else {
        cb(new Error('Only image files with valid extensions are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    }
});

export default upload;
