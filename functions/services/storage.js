const axios = require('axios');

/**
 * Download image from URL and convert to base64
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string>} Base64 encoded image
 */
const downloadImageAsBase64 = async (imageUrl) => {
  const imageResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer'
  });
  return Buffer.from(imageResponse.data).toString('base64');
};

module.exports = {
  downloadImageAsBase64
};
