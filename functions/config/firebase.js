const admin = require('firebase-admin');

// Disable emulator host when running in Firebase Functions
if (process.env.FUNCTIONS_EMULATOR) {
  delete process.env.FIREBASE_DATABASE_EMULATOR_HOST;
}

admin.initializeApp({
  projectId: 'when2eat-fb846',
  databaseURL: 'https://when2eat-fb846-default-rtdb.firebaseio.com'
});

const db = admin.database();

module.exports = {
  admin,
  db
};
