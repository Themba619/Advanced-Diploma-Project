// const nodemailer = require("nodemailer");

// exports.sendEmail = async (req, res) => {
//   try {
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

exports.sendEmail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const attachments = (req.files || []).map(file => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype,
    }));

    // Replace with your real email provider settings
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,  // e.g. youremail@gmail.com
        pass: process.env.GMAIL_PASS,  // app password (NOT your Gmail login password)
      },
    });

    const info = await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.GMAIL_USER, // You receive the message here
      subject: `Contact Form Submission from ${name}`,
      text: message,
      html: `<p>${message}</p>`,
      attachments,
    });

    res.status(200).json({ message: "Email sent", messageId: info.messageId });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
};
