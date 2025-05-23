/**
 * AI管理服务
 * 提供统一的AI API调用接口
 */
import { getProvider, DEFAULT_API, getAllProviders } from './api/ApiRegistry';
import { executeWithFallbackStrategy } from './AiFallbackService';

/**
 * Returns the currently configured default API
 * @returns {string} - The default API type
 */
export const getDefaultAPI = () => {
  return DEFAULT_API;
};

/**
 * 获取所有可用的API提供者信息
 * @returns {Array} 提供者信息数组
 */
export const getAvailableProviders = () => {
  const providers = getAllProviders();
  return Object.values(providers).map(p => ({
    type: p.type,
    name: p.name,
    supportsFallback: p.supportsFallback
  }));
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
  const currentApiType = apiType || DEFAULT_API;
  
  // 获取API提供者
  const provider = getProvider(currentApiType);
  if (!provider) {
    throw new Error(`不支持的API类型: ${currentApiType}`);
  }
  
  // 记录调用信息
  console.log(`Using API (${provider.name}) with prompt: ${text.substring(0, 50)}...`);
  
  let response;
  
  try {
    // OpenRouter具有特殊的回退策略
    if (provider.type === 'openrouter') {
      // 使用高级回退服务
      const allProviders = getAllProviders();
      const configs = Object.values(allProviders).reduce((acc, p) => {
        acc[p.type.toUpperCase() + '_CONFIG'] = p.getDefaultConfig();
        return acc;
      }, {});
      
      const result = await executeWithFallbackStrategy(text, options, {
        ...configs,
        API_TYPES: Object.keys(allProviders).reduce((types, type) => {
          types[type.toUpperCase()] = type;
          return types;
        }, {})
      });
      
      response = result.response;
      response.usedApiType = result.apiType;
      
      if (result.model) {
        response.usedModel = result.model;
      }
      
      if (result.fallbackUsed) {
        response.fallbackUsed = true;
        response.originalApiType = result.originalApiType;
      }
    } else {
      // 直接调用提供者的API
      response = await provider.callApi(text, options);
    }
    
    return response;
  } catch (error) {
    console.error(`${provider.name} API调用失败:`, error);
    throw error;
  }
};

/**
 * Format the API response to a standardized structure
 * @param {object} response - The raw API response
 * @returns {object} - Standardized response object
 */
export const formatResponse = (response) => {
  try {
    // 获取使用的API类型
    const apiType = response.usedApiType;
    if (!apiType) {
      throw new Error('无法确定API类型');
    }
    
    // 获取相应的提供者
    const provider = getProvider(apiType);
    if (!provider) {
      throw new Error(`未找到API类型 ${apiType} 的提供者`);
    }
    
    // 使用提供者的格式化方法
    const formattedResponse = provider.formatResponse(response);
    
    // 添加额外的回退信息
    if (response.fallbackUsed) {
      formattedResponse.fallbackUsed = true;
      formattedResponse.originalApiType = response.originalApiType;
    }
    
    if (response.usedModel) {
      formattedResponse.usedModel = response.usedModel;
    }
    
    return formattedResponse;
  } catch (error) {
    console.error(`格式化响应时出错:`, error);
    throw error;
  }
};