const functions = require('firebase-functions');
const emailjs = require('@emailjs/nodejs');

// Check if EmailJS is configured
const emailjsConfig = functions.config().emailjs || {};
const hasEmailJsConfig = Boolean(
  emailjsConfig.service_id &&
  emailjsConfig.template_id &&
  emailjsConfig.public_key &&
  emailjsConfig.private_key
);

/**
 * Build email template parameters
 * @param {Object} userProfile - User profile data
 * @param {Array} expired - Expired items
 * @param {Array} expiringSoon - Items expiring soon
 * @returns {Object} Template parameters
 */
const buildTemplateParams = (userProfile, expired, expiringSoon, formatItemsList) => ({
  to_email: userProfile.email,
  to_name: userProfile.displayName || userProfile.email,
  summary_date: new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }),
  expired_count: expired.length,
  expiring_count: expiringSoon.length,
  expired_items: formatItemsList(expired),
  expiring_items: formatItemsList(expiringSoon),
});

/**
 * Send email via EmailJS
 * @param {Object} templateParams - Email template parameters
 * @throws {Error} If EmailJS is not configured
 */
const sendEmailJsMessage = async (templateParams) => {
  if (!hasEmailJsConfig) {
    throw new Error('EMAILJS_CONFIG_MISSING');
  }

  await emailjs.send(
    emailjsConfig.service_id,
    emailjsConfig.template_id,
    templateParams,
    {
      publicKey: emailjsConfig.public_key,
      privateKey: emailjsConfig.private_key,
    }
  );
};

module.exports = {
  hasEmailJsConfig,
  buildTemplateParams,
  sendEmailJsMessage
};
