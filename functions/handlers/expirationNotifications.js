const functions = require('firebase-functions');
const { db } = require('../config/firebase');
const { mapSnapshotToItems, categorizeItemsBySeverity, formatItemsList } = require('../utils/items');
const { hasEmailJsConfig, buildTemplateParams, sendEmailJsMessage } = require('../services/email');

/**
 * Send expiration email for a specific user
 * @param {string} userId - User ID
 * @param {Object} cachedUserRecord - Optional cached user data
 * @returns {Promise<Object>} Result object with status and details
 */
const sendExpirationEmailForUser = async (userId, cachedUserRecord = null) => {
  let userRecord = cachedUserRecord;

  if (!userRecord) {
    const snapshot = await db.ref(`users/${userId}`).get();
    if (!snapshot.exists()) {
      return { status: 'skipped', reason: 'NO_USER' };
    }
    userRecord = snapshot.val();
  }

  const { fridgeItems = {}, ...userProfile } = userRecord;
  console.log({ fridgeItems });

  if (!userProfile.email) {
    return { status: 'skipped', reason: 'NO_EMAIL' };
  }

  const categorized = categorizeItemsBySeverity(mapSnapshotToItems(fridgeItems));

  if (categorized.total === 0) {
    return { status: 'skipped', reason: 'NO_ITEMS' };
  }

  await sendEmailJsMessage(
    buildTemplateParams(userProfile, categorized.expired, categorized.expiringSoon, formatItemsList)
  );

  await db.ref(`users/${userId}/notifications`).update({
    lastExpirationEmailAt: Date.now(),
    lastExpirationEmailCounts: {
      expired: categorized.expired.length,
      expiring: categorized.expiringSoon.length,
    },
  });

  return {
    status: 'sent',
    counts: {
      expired: categorized.expired.length,
      expiring: categorized.expiringSoon.length,
    },
  };
};

/**
 * Scheduled function to send daily expiration emails to all users
 * Runs daily at 6:00 PM Central Time
 */
const sendDailyExpirationEmails = functions.pubsub
  .schedule('00 18 * * *')
  .timeZone('America/Chicago')
  .onRun(async () => {
    if (!hasEmailJsConfig) {
      console.warn('[sendDailyExpirationEmails] EmailJS config missing; skipping run');
      return null;
    }

    const usersSnapshot = await db.ref('users').get();

    if (!usersSnapshot.exists()) {
      console.log('[sendDailyExpirationEmails] No users found');
      return null;
    }

    const tasks = [];

    usersSnapshot.forEach((userSnapshot) => {
      const userId = userSnapshot.key;
      const userData = userSnapshot.val();

      tasks.push(
        sendExpirationEmailForUser(userId, userData)
          .then((result) => {
            console.log(`[sendDailyExpirationEmails] Processed ${userId}: ${result.status}`, result.reason || result.counts);
          })
          .catch((error) => {
            console.error(`[sendDailyExpirationEmails] Failed for ${userId}`, error);
          })
      );
    });

    await Promise.all(tasks);
    return null;
  });

/**
 * Callable function to send a test expiration email to the authenticated user
 */
const sendTestExpirationEmail = functions.https.onCall(async (_data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to request a test email.');
  }

  if (!hasEmailJsConfig) {
    throw new functions.https.HttpsError('failed-precondition', 'Email notifications are not configured.');
  }

  try {
    const result = await sendExpirationEmailForUser(context.auth.uid);
    return result;
  } catch (error) {
    console.error('[sendTestExpirationEmail] Failed to send test email', error);
    throw new functions.https.HttpsError('internal', 'Unable to send test email at this time.');
  }
});

module.exports = {
  sendExpirationEmailForUser,
  sendDailyExpirationEmails,
  sendTestExpirationEmail
};
