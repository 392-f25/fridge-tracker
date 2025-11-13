This file describes a list of criteria for a feature I would like you to implement.

The feature should be a recipe generator that allows the user to select a number of ingredients and generate a recipe using those ingredients, which will then be displayed to the user. 

The feature should query the OpenAI API to prompt an LLM with a list of ingredients, asking it for a recipe using all of the ingredients. The returned recipie should be limited in scope, with each step being at most 10 words. 

The user should be able to select a "generate recipe" button on the main page and then select a number of ingredients to be used in the recipe generation.

The recipe should be displayed in its own section on the main page, with an option to delete the recipe. 

Note: The OpenAI API key should be configured in Firebase Functions config using:
`firebase functions:config:set openai.api_key="your-api-key"`


