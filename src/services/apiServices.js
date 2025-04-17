/**
 * API调用服务
 * 包含所有直接调用各种API的函数
 */
import { GLM_CONFIG, GEMINI_CONFIG, MISTRAL_CONFIG } from '../config/apiConfig';

/**
 * Call Gemini API
 */
export const callGeminiApi = async (text, options = {}) => {
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
 */
export const callGlmApi = async (text, options = {}) => {
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
 * @param {string} text - The text prompt to send
 * @param {boolean} usePixtral - Whether to use the Pixtral model instead of standard Mistral
 * @param {object} options - Additional options for the API call
 * @returns {Promise} - Promise with the API response
 */
export const callMistralApi = async (text, usePixtral = false, options = {}) => {
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