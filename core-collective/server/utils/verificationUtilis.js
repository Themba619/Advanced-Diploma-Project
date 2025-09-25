const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

const getVerificationExpiry = () => {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10); // Code expires in 10 minutes
  return expires;
};

module.exports = {
  generateVerificationCode,
  getVerificationExpiry
};