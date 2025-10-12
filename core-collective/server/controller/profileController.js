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

// Path to the profile data JSON file
const profileDataPath = path.join(__dirname, "../data/profileImages.json");

// Helper function to read profile data
const readProfileData = () => {
  try {
    if (fs.existsSync(profileDataPath)) {
      const data = fs.readFileSync(profileDataPath, "utf8");
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error("Error reading profile data:", error);
    return {};
  }
};

// Helper function to write profile data
const writeProfileData = (data) => {
  try {
    fs.writeFileSync(profileDataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing profile data:", error);
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

// Helper function to get user profile with defaults
const getUserProfile = (profileData, email) => {
  const userProfile = profileData[email] || {};
  return {
    profileImage: userProfile.profileImage || null,
    course: userProfile.course || "Not specified",
    year: userProfile.year || "Not specified",
    status: userProfile.status || "Available",
  };
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

      // Read current profile data
      const profileData = readProfileData();

      // Initialize user profile if doesn't exist
      if (!profileData[userEmail]) {
        profileData[userEmail] = getUserProfile({}, userEmail);
      }

      // Delete old image if exists
      if (profileData[userEmail].profileImage) {
        deleteOldImage(profileData[userEmail].profileImage);
      }

      // Update with new image filename
      profileData[userEmail].profileImage = newFilename;

      // Save updated data
      if (writeProfileData(profileData)) {
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

// Get user's profile data (image + course + year + status)
const getUserProfileData = (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        error: "User not authenticated",
      });
    }

    const userEmail = req.user.email;
    const profileData = readProfileData();
    const userProfile = getUserProfile(profileData, userEmail);

    // Check if profile image file exists
    if (userProfile.profileImage) {
      const imagePath = path.join(
        __dirname,
        "../public/profile-images",
        userProfile.profileImage
      );
      if (!fs.existsSync(imagePath)) {
        // File doesn't exist, remove from data
        if (profileData[userEmail]) {
          profileData[userEmail].profileImage = null;
          writeProfileData(profileData);
        }
        userProfile.profileImage = null;
      }
    }

    res.json({
      success: true,
      profileData: {
        profileImage: userProfile.profileImage,
        imageUrl: userProfile.profileImage
          ? `/profile-images/${userProfile.profileImage}`
          : null,
        course: userProfile.course,
        year: userProfile.year,
        status: userProfile.status,
      },
    });
  } catch (error) {
    console.error("Error in getUserProfileData:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Save user's profile data (course + year + status)
const saveUserProfileData = (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        error: "User not authenticated",
      });
    }

    const userEmail = req.user.email;
    const { course, year, status } = req.body;

    // Validate input
    if (!course && !year && !status) {
      return res.status(400).json({
        error: "At least one field (course, year, status) must be provided",
      });
    }

    // Read current profile data
    const profileData = readProfileData();

    // Initialize user profile if doesn't exist
    if (!profileData[userEmail]) {
      profileData[userEmail] = getUserProfile({}, userEmail);
    }

    // Update provided fields
    if (course !== undefined) profileData[userEmail].course = course;
    if (year !== undefined) profileData[userEmail].year = year;
    if (status !== undefined) profileData[userEmail].status = status;

    // Save updated data
    if (writeProfileData(profileData)) {
      res.json({
        success: true,
        message: "Profile data saved successfully",
        profileData: {
          course: profileData[userEmail].course,
          year: profileData[userEmail].year,
          status: profileData[userEmail].status,
        },
      });
    } else {
      res.status(500).json({
        error: "Failed to save profile data",
      });
    }
  } catch (error) {
    console.error("Error in saveUserProfileData:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = {
  uploadProfileImage,
  getUserProfileData,
  saveUserProfileData,
};
