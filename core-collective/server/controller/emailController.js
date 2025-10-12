// const nodemailer = require("nodemailer");

// exports.sendEmail = async (req, res)     const transporter = createTransporter();   try {
//     // Accept frontend fields
//     const { name, email, message } = req.body;

//     if(!name || !email) {
//         return res.status(400).json({ error: "Name and email are required"});
//     }

//     const attachments = (req.files || []).map(file => ({
//       filename: file.originalname,
//       content: file.buffer,
//       contentType: file.mimetype,
//     }));

//     const transporter = nodemailer.createTransport({
//       host: "smtp.ethereal.email",
//       port: 587,
//       secure: false,
//       auth: {
//         user: process.env.ETHEREAL_USER,
//         pass: process.env.ETHEREAL_PASS,
//       },
//     });

//     const info = await transporter.sendMail({
//       from: `"${name}" <${email}>`,
//       to: process.env.ETHEREAL_USER,
//       subject: `Contact Form Submission from ${name}`,
//       text: message,
//       html: `<p>${message}</p>`,
//       attachments,
//     });

//     res.status(200).json({ message: "Email sent", messageId: info.messageId });
//   } catch (error) {
//     console.error("Error sending email:", error);
//     res.status(500).json({ error: "Failed to send email" });
//   }
// };

const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// In-memory storage for OTPs (in production, use Redis or database)
const otpStorage = new Map();

// Function to generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to generate random password
const generateRandomPassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Function to create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
};

exports.sendEmail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const attachments = (req.files || []).map((file) => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype,
    }));

    // Replace with your real email provider settings
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "thembabiyela20@gmail.com", // e.g. youremail@gmail.com
        pass: "tpie gilg udvq utgr", // app password (NOT your Gmail login password)
      },
    });

    const info = await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.GMAIL_USER, // You receive the message here
      subject: `Contact Form Submission from ${name}`,
      text: message,
      html: `<p>From: ${email} Message: ${message}</p>`,
      attachments,
    });

    res.status(200).json({ message: "Email sent", messageId: info.messageId });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
};

exports.sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration (5 minutes)
    otpStorage.set(email, {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
    });

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"Core Collective" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - Core Collective",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password. Please use the following OTP to verify your identity:</p>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>Core Collective Team</p>
        </div>
      `,
    });

    res.status(200).json({
      message: "OTP sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

exports.verifyOTPAndResetPassword = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const storedData = otpStorage.get(email);

    if (!storedData) {
      return res.status(400).json({ error: "OTP not found or expired" });
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expires) {
      otpStorage.delete(email);
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Check attempts limit
    if (storedData.attempts >= 3) {
      otpStorage.delete(email);
      return res
        .status(400)
        .json({ error: "Too many attempts. Please request a new OTP." });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // OTP is valid, generate new password and update database
    const newPassword = generateRandomPassword();

    try {
      // First check if user exists in database
      const userResult = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      const user = userResult.rows[0];

      if (!user) {
        // Remove OTP from storage
        otpStorage.delete(email);
        return res.status(404).json({ error: "User not found" });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      // Update password in database
      await pool.query("UPDATE users SET password_hash = $1 WHERE email = $2", [
        newPasswordHash,
        email,
      ]);

      // Remove OTP from storage after successful database update
      otpStorage.delete(email);

      const transporter = createTransporter();

      const info = await transporter.sendMail({
        from: `"Core Collective" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Password Reset Successful - Core Collective",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Successful</h2>
            <p>Your password has been successfully reset. Here is your new temporary password:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0;">
              ${newPassword}
            </div>
            <p style="color: #e74c3c; font-weight: bold;">⚠️ Important Security Notice:</p>
            <ul style="color: #666;">
              <li>Please log in immediately and change this temporary password</li>
              <li>Do not share this password with anyone</li>
              <li>Delete this email after changing your password</li>
            </ul>
            <p>Best regards,<br>Core Collective Team</p>
          </div>
        `,
      });

      res.status(200).json({
        message: "Password reset successful. New password sent to your email.",
        messageId: info.messageId,
      });
    } catch (dbError) {
      console.error("Database error during password reset:", dbError);
      // Remove OTP from storage on database error
      otpStorage.delete(email);
      return res
        .status(500)
        .json({ error: "Failed to update password in database" });
    }
  } catch (error) {
    console.error("Error verifying OTP and resetting password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

exports.resetPasswordWithNewPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, OTP, and new password are required" });
    }

    const storedData = otpStorage.get(email);

    if (!storedData) {
      return res.status(400).json({ error: "OTP not found or expired" });
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expires) {
      otpStorage.delete(email);
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Check attempts limit
    if (storedData.attempts >= 3) {
      otpStorage.delete(email);
      return res
        .status(400)
        .json({ error: "Too many attempts. Please request a new OTP." });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Password complexity check
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)",
      });
    }

    try {
      // First check if user exists in database
      const userResult = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      const user = userResult.rows[0];

      if (!user) {
        // Remove OTP from storage
        otpStorage.delete(email);
        return res.status(404).json({ error: "User not found" });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      // Update password in database
      await pool.query("UPDATE users SET password_hash = $1 WHERE email = $2", [
        newPasswordHash,
        email,
      ]);

      // Remove OTP from storage after successful database update
      otpStorage.delete(email);

      const transporter = createTransporter();

      const info = await transporter.sendMail({
        from: `"Core Collective" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Password Changed Successfully - Core Collective",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Changed Successfully</h2>
            <p>Your password has been successfully changed.</p>
            <p>You can now log in with your new password.</p>
            <p style="color: #e74c3c; font-weight: bold;">⚠️ Security Notice:</p>
            <ul style="color: #666;">
              <li>If you didn't make this change, please contact support immediately</li>
              <li>We recommend enabling two-factor authentication for added security</li>
            </ul>
            <p>Best regards,<br>Core Collective Team</p>
          </div>
        `,
      });

      res.status(200).json({
        message: "Password changed successfully.",
        messageId: info.messageId,
      });
    } catch (dbError) {
      console.error("Database error during password reset:", dbError);
      // Remove OTP from storage on database error
      otpStorage.delete(email);
      return res
        .status(500)
        .json({ error: "Failed to update password in database" });
    }
  } catch (error) {
    console.error("Error resetting password with new password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

exports.reportPost = async (req, res) => {
  try {
    const { postId, postTitle, postUser, reason, description, reportedBy } =
      req.body;

    if (!postId || !postTitle || !reason) {
      return res
        .status(400)
        .json({ error: "Post ID, title, and reason are required" });
    }

    const transporter = createTransporter();

    const reportDate = new Date().toLocaleString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const info = await transporter.sendMail({
      from: `"Core Collective Reports" <${process.env.GMAIL_USER}>`,
      to: "thembabiyela20@gmail.com",
      subject: `🚨 Forum Post Report - ${reason}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 Forum Post Report</h1>
          </div>
          
          <div style="padding: 25px;">
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h2 style="color: #495057; margin: 0 0 10px 0;">Report Details</h2>
              <p style="margin: 5px 0;"><strong>Report Date:</strong> ${reportDate}</p>
              <p style="margin: 5px 0;"><strong>Reported By:</strong> ${
                reportedBy || "Anonymous"
              }</p>
              <p style="margin: 5px 0;"><strong>Reason:</strong> <span style="color: #dc3545; font-weight: bold;">${reason}</span></p>
            </div>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
              <h2 style="color: #856404; margin: 0 0 10px 0;">Reported Post Information</h2>
              <p style="margin: 5px 0;"><strong>Post ID:</strong> ${postId}</p>
              <p style="margin: 5px 0;"><strong>Post Title:</strong> "${postTitle}"</p>
              <p style="margin: 5px 0;"><strong>Post Author:</strong> ${
                postUser || "Unknown"
              }</p>
            </div>

            ${
              description
                ? `
            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; margin-bottom: 20px;">
              <h2 style="color: #004085; margin: 0 0 10px 0;">Additional Details</h2>
              <p style="margin: 0; color: #004085; line-height: 1.5;">${description}</p>
            </div>
            `
                : ""
            }

            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8;">
              <h2 style="color: #0c5460; margin: 0 0 10px 0;">Next Steps</h2>
              <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
                <li>Review the reported post in the forum</li>
                <li>Investigate the claim based on community guidelines</li>
                <li>Take appropriate action (warning, content removal, user suspension, etc.)</li>
                <li>Consider reaching out to both the reporter and the post author if needed</li>
              </ul>
            </div>

            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d;">
              <p style="margin: 0; font-size: 14px;">
                This report was automatically generated from the Core Collective Forum.<br>
                Please review and take appropriate action as soon as possible.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    res.status(200).json({
      message:
        "Report submitted successfully. Thank you for helping keep our community safe.",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error sending post report:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
};
