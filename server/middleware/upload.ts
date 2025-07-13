import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/user-photos',
    'uploads/clothing-images',
    'uploads/try-on-results',
    'uploads/brand-logos'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine upload path based on field name or route
    if (file.fieldname === 'photo' || req.path.includes('upload-photo')) {
      uploadPath += 'user-photos/';
    } else if (file.fieldname === 'logo' || req.path.includes('logo')) {
      uploadPath += 'brand-logos/';
    } else if (file.fieldname === 'image' || req.path.includes('clothing')) {
      uploadPath += 'clothing-images/';
    } else {
      uploadPath += 'misc/';
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 5 // Maximum 5 files per request
  },
  fileFilter
});

// Middleware for different upload types
export const uploadUserPhoto = upload.single('photo');
export const uploadClothingImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'overlayImage', maxCount: 1 }
]);
export const uploadBrandLogo = upload.single('logo');
export const uploadMultiple = upload.array('files', 5);

// Helper function to get file URL
export const getFileUrl = (req: any, filename: string, folder: string = '') => {
  const protocol = req.protocol;
  const host = req.get('host');
  const basePath = folder ? `uploads/${folder}` : 'uploads';
  return `${protocol}://${host}/${basePath}/${filename}`;
};

// Helper function to delete file
export const deleteFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Cleanup old files (can be called periodically)
export const cleanupOldFiles = (directory: string, maxAgeHours: number = 24) => {
  try {
    const files = fs.readdirSync(directory);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up files:', error);
  }
};