const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/profile-images");
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename using timestamp and original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Path to the profile images JSON file
const profileImagesPath = path.join(__dirname, "../data/profileImages.json");

// Helper function to read profile images data
const readProfileImagesData = () => {
  try {
    if (fs.existsSync(profileImagesPath)) {
      const data = fs.readFileSync(profileImagesPath, "utf8");
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error("Error reading profile images data:", error);
    return {};
  }
};

// Helper function to write profile images data
const writeProfileImagesData = (data) => {
  try {
    fs.writeFileSync(profileImagesPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing profile images data:", error);
    return false;
  }
};

// Helper function to delete old image file
const deleteOldImage = (filename) => {
  if (!filename) return;

  const filePath = path.join(__dirname, "../public/profile-images", filename);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Deleted old profile image:", filename);
    }
  } catch (error) {
    console.error("Error deleting old image:", error);
  }
};

// Upload profile image
const uploadProfileImage = (req, res) => {
  // Use multer middleware
  upload.single("profileImage")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        error: err.message || "Error uploading file",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({
        error: "User not authenticated",
      });
    }

    try {
      const userEmail = req.user.email;
      const newFilename = req.file.filename;

      // Read current profile images data
      const profileImages = readProfileImagesData();

      // Delete old image if exists
      if (profileImages[userEmail]) {
        deleteOldImage(profileImages[userEmail]);
      }

      // Update mapping with new filename
      profileImages[userEmail] = newFilename;

      // Save updated data
      if (writeProfileImagesData(profileImages)) {
        res.json({
          success: true,
          message: "Profile image uploaded successfully",
          filename: newFilename,
          imageUrl: `/profile-images/${newFilename}`,
        });
      } else {
        // If saving fails, delete the uploaded file
        deleteOldImage(newFilename);
        res.status(500).json({
          error: "Failed to save image mapping",
        });
      }
    } catch (error) {
      console.error("Error in uploadProfileImage:", error);
      // Delete uploaded file if there was an error
      if (req.file) {
        deleteOldImage(req.file.filename);
      }
      res.status(500).json({
        error: "Internal server error",
      });
    }
  });
};

// Get user's profile image
const getUserProfileImage = (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        error: "User not authenticated",
      });
    }

    const userEmail = req.user.email;
    const profileImages = readProfileImagesData();

    if (profileImages[userEmail]) {
      const filename = profileImages[userEmail];
      const imagePath = path.join(
        __dirname,
        "../public/profile-images",
        filename
      );

      // Check if file exists
      if (fs.existsSync(imagePath)) {
        res.json({
          success: true,
          filename: filename,
          imageUrl: `/profile-images/${filename}`,
        });
      } else {
        // File doesn't exist, remove from mapping
        delete profileImages[userEmail];
        writeProfileImagesData(profileImages);
        res.json({
          success: true,
          filename: null,
          imageUrl: null,
        });
      }
    } else {
      res.json({
        success: true,
        filename: null,
        imageUrl: null,
      });
    }
  } catch (error) {
    console.error("Error in getUserProfileImage:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = {
  uploadProfileImage,
  getUserProfileImage,
};
