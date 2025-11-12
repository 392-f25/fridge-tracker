const functions = require('firebase-functions');
const { admin, db } = require('../config/firebase');
const { downloadImageAsBase64 } = require('../services/storage');
const { processReceiptWithAI } = require('../services/openai');

/**
 * Firebase Function to process receipt images with OCR
 * Triggered when a new receipt is added to /receipts/queue
 */
const processReceipt = functions
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
      console.log(`[processReceipt] Processing receipt ${receiptId} for user ${data.userId}`);

      // Step 1: Download image as base64
      const base64Image = await downloadImageAsBase64(data.imageUrl);

      // Step 2: Process with OpenAI Vision
      const result = await processReceiptWithAI(base64Image);
      console.log(`[processReceipt] Extracted ${result.items.length} items from receipt`);

      // Step 3: Save items to database
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
      console.log(`[processReceipt] Saved ${result.items.length} items to database`);

      // Step 4: Move to processed
      await db.ref(`/receipts/queue/${receiptId}`).remove();
      await db.ref(`/receipts/processed/${receiptId}`).set({
        userId: data.userId,
        itemCount: result.items.length,
        store: result.store,
        date: result.date,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });

      console.log(`[processReceipt] Receipt ${receiptId} processed successfully`);
      return null;

    } catch (error) {
      console.error(`[processReceipt] Error processing receipt ${receiptId}:`, error);

      // Move to failed
      await db.ref(`/receipts/queue/${receiptId}`).remove();
      await db.ref(`/receipts/failed/${receiptId}`).set({
        userId: data.userId,
        error: error.message,
        timestamp: admin.database.ServerValue.TIMESTAMP
      });

      return null;
    }
  });

module.exports = processReceipt;
