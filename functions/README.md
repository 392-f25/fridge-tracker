# Firebase Cloud Functions - Fridge Tracker

This directory contains the Firebase Cloud Functions for the Fridge Tracker application, organized in a modular structure for better maintainability.

## Project Structure

```
functions/
├── index.js                          # Main entry point, exports all functions
├── config/
│   └── firebase.js                   # Firebase Admin initialization
├── services/
│   ├── openai.js                     # OpenAI Vision API integration
│   ├── email.js                      # EmailJS service for notifications
│   └── storage.js                    # Image download/storage utilities
├── utils/
│   ├── date.js                       # Date calculation helpers
│   └── items.js                      # Item categorization & formatting
├── handlers/
│   ├── receiptProcessor.js           # Receipt OCR processing logic
│   └── expirationNotifications.js    # Email notification functions
└── package.json
```

## Cloud Functions

### 1. `processReceipt`
**Type:** Database Trigger
**Path:** `/receipts/queue/{receiptId}`
**Purpose:** Process uploaded receipt images with OpenAI Vision API and extract grocery items

**Flow:**
1. Triggered when a new receipt is added to the queue
2. Downloads the image from Firebase Storage
3. Processes with OpenAI Vision API to extract items
4. Saves items to user's fridge
5. Moves receipt to `processed` or `failed` collection

### 2. `sendDailyExpirationEmails`
**Type:** Scheduled Function
**Schedule:** Daily at 6:00 PM Central Time
**Purpose:** Send email notifications to users about expiring items

**Flow:**
1. Runs automatically every day at 6 PM CT
2. Iterates through all users
3. Checks for expired or expiring items (within 3 days)
4. Sends email via EmailJS if items found
5. Updates notification tracking in database

### 3. `sendTestExpirationEmail`
**Type:** Callable Function
**Purpose:** Allow users to manually trigger a test expiration email

**Flow:**
1. User calls from frontend
2. Validates authentication
3. Sends immediate email for current user's items
4. Returns result status

### 4. `generateRecipeFromIngredients`
**Type:** Callable Function
**Purpose:** Generate a recipe using OpenAI API based on selected ingredients

**Flow:**
1. User calls from frontend with array of ingredient names
2. Validates authentication and input (max 10 ingredients)
3. Calls OpenAI API to generate a recipe using all provided ingredients
4. Returns recipe with name, ingredients, instructions (max 10 words per step), prep time, and servings

## Module Details

### Config
- **firebase.js**: Initializes Firebase Admin SDK with project credentials

### Services
- **openai.js**: Handles OpenAI Vision API calls for receipt processing and recipe generation
- **email.js**: Manages EmailJS integration for sending notification emails
- **storage.js**: Downloads and converts images to base64

### Utils
- **date.js**: Date manipulation and formatting functions
- **items.js**: Item categorization, mapping, and text formatting

### Handlers
- **receiptProcessor.js**: Main logic for receipt OCR processing
- **expirationNotifications.js**: Email notification logic and scheduling
- **recipeGenerator.js**: Recipe generation logic using OpenAI API

## Development

### Running Locally
```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Deploy to Firebase
firebase deploy --only functions
```

### Testing
```bash
# Test specific function
firebase functions:shell

# View logs
firebase functions:log
firebase functions:log --only processReceipt
```

## Configuration Required

### OpenAI API Key
```bash
firebase functions:config:set openai.api_key="your-api-key"
```

### EmailJS Configuration
```bash
firebase functions:config:set emailjs.service_id="your-service-id"
firebase functions:config:set emailjs.template_id="your-template-id"
firebase functions:config:set emailjs.public_key="your-public-key"
firebase functions:config:set emailjs.private_key="your-private-key"
```

## Adding New Functions

1. Create a new handler file in `handlers/` directory
2. Import necessary services/utils
3. Export the function from `index.js`
4. Deploy with `firebase deploy --only functions`

## Best Practices

- Keep handlers focused on orchestration
- Extract reusable logic into services/utils
- Add logging for debugging
- Handle errors gracefully
- Document new functions in this README
