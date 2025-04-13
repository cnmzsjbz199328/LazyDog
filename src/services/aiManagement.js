import { GLM_CONFIG, GEMINI_CONFIG, MISTRAL_CONFIG, DEFAULT_API, API_TYPES } from '../config/apiConfig';

/**
 * Unified AI API Management System
 * Handles different API formats and provides a consistent interface
 * 
 * NOTE: This system uses a prioritized API selection approach:
 * 1. If an apiType is explicitly specified in the function call, that API will be used
 * 2. If no apiType is specified, the DEFAULT_API from config will be used
 * 3. The system is NOT random - it follows these priority rules
 */

/**
 * Returns the currently configured default API
 * @returns {string} - The default API ('gemini', 'glm', 'mistral', or 'mistral_pixtral')
 */
export const getDefaultAPI = () => {
  return DEFAULT_API;
};

/**
 * Call AI API with a unified interface
 * @param {string} text - The prompt text to send to the AI
 * @param {string} apiType - Which API to use. If not provided, DEFAULT_API will be used.
 * @param {object} options - Additional options to configure the request
 * @returns {Promise} - Promise with the API response
 */
export const callAI = async (text, apiType = DEFAULT_API, options = {}) => {
  // Log which API is being used and why
  if (apiType === DEFAULT_API) {
    console.log(`Using default API (${apiType}) with prompt: ${text.substring(0, 50)}...`);
  } else {
    console.log(`Using specified API (${apiType}) with prompt: ${text.substring(0, 50)}...`);
  }
  
  // Select the appropriate API handler based on apiType
  switch (apiType.toLowerCase()) {
    case API_TYPES.GLM:
      return callGlmApi(text, options);
    case API_TYPES.GEMINI:
      return callGeminiApi(text, options);
    case API_TYPES.MISTRAL:
      return callMistralApi(text, false, options);
    case API_TYPES.MISTRAL_PIXTRAL:
      return callMistralApi(text, true, options);
    default:
      throw new Error(`Unsupported API type: ${apiType}`);
  }
};

/**
 * Format the API response to a standardized structure
 * @param {object} response - The raw API response
 * @param {string} apiType - Which API the response came from
 * @returns {object} - Standardized response object
 */
export const formatResponse = (response, apiType) => {
  try {
    if (apiType === API_TYPES.GEMINI) {
      if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return {
          text: response.candidates[0].content.parts[0].text.trim(),
          rawResponse: response
        };
      }
    } else if (apiType === API_TYPES.GLM) {
      if (response?.choices?.[0]?.message?.content) {
        return {
          text: response.choices[0].message.content.trim(),
          rawResponse: response
        };
      }
    } else if (apiType === API_TYPES.MISTRAL || apiType === API_TYPES.MISTRAL_PIXTRAL) {
      if (response?.choices?.[0]?.message?.content) {
        return {
          text: response.choices[0].message.content.trim(),
          rawResponse: response
        };
      }
    }
    
    throw new Error('Unexpected API response structure');
  } catch (error) {
    console.error(`Error formatting ${apiType} response:`, error);
    throw error;
  }
};

/**
 * Call Gemini API
 * @private
 */
const callGeminiApi = async (text, options = {}) => {
  const { apiKey, endpoint } = GEMINI_CONFIG;
  const url = `${endpoint}?key=${apiKey}`;
  
  const data = {
    contents: [{
      parts: [{ text }]
    }],
    ...options
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
};

/**
 * Call GLM API
 * @private
 */
const callGlmApi = async (text, options = {}) => {
  const { apiKey, endpoint, model, defaultParams } = GLM_CONFIG;
  
  const data = {
    model,
    messages: [
      {
        role: 'user',
        content: text
      }
    ],
    ...defaultParams,
    ...options
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GLM API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('GLM API call failed:', error);
    throw error;
  }
};

/**
 * Call Mistral API
 * @private
 * @param {string} text - The text prompt to send
 * @param {boolean} usePixtral - Whether to use the Pixtral model instead of standard Mistral
 * @param {object} options - Additional options for the API call
 * @returns {Promise} - Promise with the API response
 */
const callMistralApi = async (text, usePixtral = false, options = {}) => {
  const { apiKey, endpoint, models, defaultParams } = MISTRAL_CONFIG;
  
  const model = usePixtral ? models.pixtral : models.small;
  
  const data = {
    model,
    messages: [
      {
        role: 'user',
        content: text
      }
    ],
    ...defaultParams,
    ...options
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Mistral API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Mistral API call failed:', error);
    throw error;
  }
};