import multer from 'multer';
import path from 'path';

// Define storage for videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // specify the directory where videos should be stored
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension
    cb(null, Date.now() + ext); // Create a unique filename based on the timestamp
  }
});

// File filter to allow only video files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/mkv', 'video/avi']; // Allowed video formats
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'), false); // Reject the file
  }
};

const upload = multer({ storage, fileFilter });
export default upload;
