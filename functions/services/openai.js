const functions = require('firebase-functions');
const OpenAI = require('openai');

/**
 * Process receipt image with OpenAI Vision API
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<Object>} Parsed receipt data
 */
const processReceiptWithAI = async (base64Image) => {
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

  return JSON.parse(responseContent);
};

/**
 * Generate a recipe using OpenAI API
 * @param {string[]} ingredients - Array of ingredient names
 * @returns {Promise<Object>} Generated recipe data
 */
const generateRecipe = async (ingredients) => {
  const openai = new OpenAI({
    apiKey: functions.config().openai.api_key
  });

  const ingredientsList = ingredients.join(', ');

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful cooking assistant. Generate a recipe using the provided ingredients. 
        Return ONLY valid JSON in this exact format:
        {
          "name": "Recipe name",
          "ingredients": ["ingredient1", "ingredient2", ...],
          "instructions": ["step 1", "step 2", ...],
          "prepTime": 15,
          "servings": 4
        }
        
        Important constraints:
        - Each instruction step must be at most 10 words
        - Use all provided ingredients in the recipe
        - Instructions should be clear and concise
        - prepTime is in minutes
        - servings is a number`
      },
      {
        role: "user",
        content: `Generate a recipe using these ingredients: ${ingredientsList}`
      }
    ],
    max_tokens: 800,
    temperature: 0.7,
    response_format: { type: "json_object" }
  });

  // Extract and parse JSON response (strip markdown if present)
  let responseContent = completion.choices[0].message.content.trim();
  console.log('Raw OpenAI recipe response:', responseContent);

  // Remove markdown code blocks if present
  if (responseContent.startsWith('```')) {
    responseContent = responseContent
      .replace(/^```(?:json)?\n?/, '')  // Remove opening ```json
      .replace(/\n?```$/, '');           // Remove closing ```
    console.log('Cleaned recipe response:', responseContent);
  }

  return JSON.parse(responseContent);
};

module.exports = {
  processReceiptWithAI,
  generateRecipe
};
