const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');
const axios = require('axios');
const emailjs = require('@emailjs/nodejs');

if (process.env.FUNCTIONS_EMULATOR) {
  delete process.env.FIREBASE_DATABASE_EMULATOR_HOST;
}

admin.initializeApp({
  projectId: 'when2eat-fb846',
  databaseURL: 'https://when2eat-fb846-default-rtdb.firebaseio.com'
});



const emailjsConfig = functions.config().emailjs || {};
const hasEmailJsConfig = Boolean(
  emailjsConfig.service_id &&
  emailjsConfig.template_id &&
  emailjsConfig.public_key &&
  emailjsConfig.private_key
);

const toStartOfDay = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const calculateDaysUntilExpiration = (isoDate) => {
  const today = toStartOfDay(new Date());
  const expiry = toStartOfDay(isoDate);
  if (!today || !expiry) return null;
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatDaysText = (days) => {
  if (days === null || days === undefined) return 'Unknown expiration';
  if (days < 0) {
    const value = Math.abs(days);
    return `Expired ${value} day${value === 1 ? '' : 's'} ago`;
  }
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `Expires in ${days} days`;
};

const formatItemLine = (item) => {
  return `• ${item.name || 'Unnamed item'} (${item.category || 'uncategorized'}) - ${formatDaysText(item.daysUntilExpiration)}`;
};

const formatItemsList = (items) => (
  items.length ? items.map(formatItemLine).join('\n') : 'None 🎉'
);

const mapSnapshotToItems = (items = {}) => {
  return Object.entries(items).map(([id, value]) => ({
    id,
    name: value.name,
    category: value.category,
    quantity: value.quantity,
    unit: value.unit,
    expirationDate: value.expirationDate,
  }));
};

const categorizeItemsBySeverity = (items) => {
  const expired = [];
  const expiringSoon = [];

  items.forEach((item) => {
    const days = calculateDaysUntilExpiration(item.expirationDate);
    if (days === null) return;

    const enhancedItem = { ...item, daysUntilExpiration: days };
    if (days < 0) {
      expired.push(enhancedItem);
    } else if (days <= 3) {
      expiringSoon.push(enhancedItem);
    }
  });

  return {
    expired,
    expiringSoon,
    total: expired.length + expiringSoon.length,
  };
};

const buildTemplateParams = (userProfile, expired, expiringSoon) => ({
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

const sendExpirationEmailForUser = async (userId, cachedUserRecord = null) => {
  const db = admin.database();
  let userRecord = cachedUserRecord;

  if (!userRecord) {
    const snapshot = await db.ref(`users/${userId}`).get();
    if (!snapshot.exists()) {
      return { status: 'skipped', reason: 'NO_USER' };
    }
    userRecord = snapshot.val();
  }

  const { fridgeItems = {}, ...userProfile } = userRecord;
  console.log({fridgeItems});

  if (!userProfile.email) {
    return { status: 'skipped', reason: 'NO_EMAIL' };
  }

  const categorized = categorizeItemsBySeverity(mapSnapshotToItems(fridgeItems));

  if (categorized.total === 0) {
    return { status: 'skipped', reason: 'NO_ITEMS' };
  }

  await sendEmailJsMessage(
    buildTemplateParams(userProfile, categorized.expired, categorized.expiringSoon)
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

exports.processReceipt = functions
  .runWith({ timeoutSeconds: 60, memory: '512MB' })
  .database.ref('/receipts/queue/{receiptId}')
  .onCreate(async (snapshot, context) => {
    const receiptId = context.params.receiptId;
    const data = snapshot.val();

    if (!data.imageUrl || !data.userId) {
      console.error('Missing required fields');
      return null;
    }

    try {
      // Download image as base64
      const imageResponse = await axios.get(data.imageUrl, {
        responseType: 'arraybuffer'
      });
      const base64Image = Buffer.from(imageResponse.data).toString('base64');

      // Process with OpenAI Vision
      const openai = new OpenAI({
        apiKey: functions.config().openai.api_key
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Extract grocery items from receipt. Return ONLY valid JSON in this exact format:
            {
              "items": [
                {
                  "name": "item name",
                  "quantity": 1,
                  "category": "produce/dairy/meat/frozen/pantry/bakery/other",
                  "expirationDays": 7
                }
              ],
              "store": "store name or null",
              "date": "YYYY-MM-DD or null"
            }

            Expiration: produce(3-7), dairy(7-14), meat(3-5), frozen(90), pantry(180), bakery(3-5), other(30)`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract items from this receipt:" },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "low"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      // Extract and parse JSON response (strip markdown if present)
      let responseContent = completion.choices[0].message.content.trim();
      console.log('Raw OpenAI response:', responseContent);

      // Remove markdown code blocks if present
      if (responseContent.startsWith('```')) {
        responseContent = responseContent
          .replace(/^```(?:json)?\n?/, '')  // Remove opening ```json
          .replace(/\n?```$/, '');           // Remove closing ```
        console.log('Cleaned response:', responseContent);
      }

      const result = JSON.parse(responseContent);

      // Save items to database
      const db = admin.database();
      const updates = {};

      result.items.forEach(item => {
        const itemId = db.ref().push().key;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + item.expirationDays);

        updates[`/users/${data.userId}/fridgeItems/${itemId}`] = {
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          expirationDate: expirationDate.toISOString(),
          addedDate: new Date().toISOString(),
          receiptId: receiptId
        };
      });

      await db.ref().update(updates);

      // Move to processed
      await db.ref(`/receipts/queue/${receiptId}`).remove();
      await db.ref(`/receipts/processed/${receiptId}`).set({
        userId: data.userId,
        itemCount: result.items.length,
        store: result.store,
        date: result.date,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });

      return null;

    } catch (error) {
      console.error('Error:', error);
      await admin.database().ref(`/receipts/queue/${receiptId}`).remove();
      await admin.database().ref(`/receipts/failed/${receiptId}`).set({
        userId: data.userId,
        error: error.message,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });
      return null;
    }
  });

exports.sendDailyExpirationEmails = functions.pubsub
  .schedule('00 18 * * *')
  .timeZone('America/Chicago')
  .onRun(async () => {
    if (!hasEmailJsConfig) {
      console.warn('[sendDailyExpirationEmails] EmailJS config missing; skipping run');
      return null;
    }

    const usersSnapshot = await admin.database().ref('users').get();

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

exports.sendTestExpirationEmail = functions.https.onCall(async (_data, context) => {
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
