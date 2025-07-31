const { Resend } = require('resend');

// Initialize Resend only when API key is available
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }
  return new Resend(process.env.RESEND_API_KEY);
};

module.exports = { getResendClient }; 