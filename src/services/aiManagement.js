import { GLM_CONFIG, GEMINI_CONFIG, MISTRAL_CONFIG, API_TYPES, DEFAULT_API } from '../config/apiConfig';

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
 * 调用 AI API 的统一接口
 * @param {string} text - 发送给 AI 的提示文本
 * @param {string|null} apiType - 使用哪种 API，如果未提供将使用内部逻辑决定
 * @param {object} options - 请求的额外配置选项
 * @returns {Promise} - 包含 API 响应的 Promise，响应中包含使用的 API 类型
 */
export const callAI = async (text, apiType = null, options = {}) => {
  // 获取当前应该使用的 API 类型
  const currentApiType = apiType || localStorage.getItem('currentApiType') || DEFAULT_API;
  
  // 记录使用的 API 类型和提示的前50个字符
  console.log(`Using API (${currentApiType}) with prompt: ${text.substring(0, 50)}...`);
  
  // 根据选择的 API 类型调用相应的 API
  let response;
  switch (currentApiType.toLowerCase()) {
    case API_TYPES.GLM:
      response = await callGlmApi(text, options);
      break;
    case API_TYPES.GEMINI:
      response = await callGeminiApi(text, options);
      break;
    case API_TYPES.MISTRAL:
      response = await callMistralApi(text, false, options);
      break;
    case API_TYPES.MISTRAL_PIXTRAL:
      response = await callMistralApi(text, true, options);
      break;
    default:
      throw new Error(`不支持的 API 类型: ${currentApiType}`);
  }
  
  // 在返回的对象中加入使用的 API 类型
  response.usedApiType = currentApiType;
  return response;
};

/**
 * Format the API response to a standardized structure
 * @param {object} response - The raw API response
 * @returns {object} - Standardized response object
 */
export const formatResponse = (response) => {
  try {
    // 从响应中获取使用的 API 类型
    const apiType = response.usedApiType;
    
    let formattedText = '';
    if (apiType === API_TYPES.GEMINI) {
      if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        formattedText = response.candidates[0].content.parts[0].text.trim();
      }
    } else if (apiType === API_TYPES.GLM) {
      if (response?.choices?.[0]?.message?.content) {
        formattedText = response.choices[0].message.content.trim();
      }
    } else if (apiType === API_TYPES.MISTRAL || apiType === API_TYPES.MISTRAL_PIXTRAL) {
      if (response?.choices?.[0]?.message?.content) {
        formattedText = response.choices[0].message.content.trim();
      }
    }
    
    if (!formattedText) {
      throw new Error('Unexpected API response structure');
    }
    
    // 返回结果中包含使用的 API 类型
    return {
      text: formattedText,
      rawResponse: response,
      apiType: apiType
    };
  } catch (error) {
    console.error(`Error formatting response:`, error);
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