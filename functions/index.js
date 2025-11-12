/**
 * Firebase Cloud Functions for Fridge Tracker
 *
 * This is the main entry point that exports all cloud functions.
 * Individual function logic is organized into separate modules for maintainability.
 */

// Initialize Firebase Admin (must be first)
require('./config/firebase');

// Import and export handlers
const processReceipt = require('./handlers/receiptProcessor');
const {
  sendDailyExpirationEmails,
  sendTestExpirationEmail
} = require('./handlers/expirationNotifications');
const generateRecipeFromIngredients = require('./handlers/recipeGenerator');

// Export cloud functions
exports.processReceipt = processReceipt;
exports.sendDailyExpirationEmails = sendDailyExpirationEmails;
exports.sendTestExpirationEmail = sendTestExpirationEmail;
exports.generateRecipeFromIngredients = generateRecipeFromIngredients;
