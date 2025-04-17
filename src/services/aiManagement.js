/**
 * AI管理服务
 * 提供统一的AI API调用接口
 */
import { API_TYPES, DEFAULT_API, GEMINI_CONFIG, GLM_CONFIG, MISTRAL_CONFIG, OPENROUTER_CONFIG } from '../config/apiConfig';
import { executeWithFallbackStrategy } from './AiFallbackService';
import { callGeminiApi, callGlmApi, callMistralApi } from './apiServices';
import { formatResponse } from './responseFormatter';

/**
 * Returns the currently configured default API
 * @returns {string} - The default API type
 */
export const getDefaultAPI = () => {
  return DEFAULT_API;
};

/**
 * 统一的AI调用接口
 * @param {string} text - 发送给AI的提示文本
 * @param {string|null} apiType - 使用哪种API，如果未提供将使用localStorage或默认值
 * @param {object} options - 请求的额外配置选项
 * @returns {Promise} - 包含API响应的Promise
 */
export const callAI = async (text, apiType = null, options = {}) => {
  // 确定要使用的API类型
  const currentApiType = apiType || localStorage.getItem('currentApiType') || DEFAULT_API;
  
  // 记录调用信息
  console.log(`Using API (${currentApiType}) with prompt: ${text.substring(0, 50)}...`);
  
  let response;
  
  // 如果是OpenRouter，使用高级回退策略
  if (currentApiType.toLowerCase() === API_TYPES.OPENROUTER) {
    try {
      // 使用高级回退服务，传递配置对象
      const result = await executeWithFallbackStrategy(
        text, 
        options,
        { OPENROUTER_CONFIG, GEMINI_CONFIG, MISTRAL_CONFIG, GLM_CONFIG, API_TYPES }
      );
      
      // 从结果中提取实际响应和元数据
      response = result.response;
      
      // 将元数据添加到响应对象中
      response.usedApiType = result.apiType;
      
      if (result.model) {
        response.usedModel = result.model;
      }
      
      if (result.fallbackUsed) {
        response.fallbackUsed = true;
        response.originalApiType = result.originalApiType;
      }
      
    } catch (error) {
      console.error('AI调用失败 (所有回退都失败):', error);
      throw error;
    }
  } else {
    // 对于非OpenRouter API，直接调用相应API
    try {
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
          throw new Error(`不支持的API类型: ${currentApiType}`);
      }
      
      response.usedApiType = currentApiType;
    } catch (error) {
      console.error(`${currentApiType} API调用失败:`, error);
      throw error;
    }
  }
  
  return response;
};

// 导出格式化函数
export { formatResponse };