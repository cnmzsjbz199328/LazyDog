/**
 * AI高级回退服务
 * 实现多级回退策略：OpenRouter失败后回退到其他外部API
 */
import { callOpenRouterWithFallback } from './openRouterService';

/**
 * 使用高级回退策略调用AI服务
 * 1. 首先尝试OpenRouter内部模型回退机制
 * 2. 如OpenRouter全部失败，则尝试外部API
 * 
 * @param {string} text - 发送给AI的文本提示
 * @param {object} options - 额外配置选项
 * @param {object} config - 包含所有API配置的对象
 * @returns {Promise<object>} - 带有响应和元数据的对象
 */
export async function executeWithFallbackStrategy(text, options = {}, config) {
  const { OPENROUTER_CONFIG, GEMINI_CONFIG, MISTRAL_CONFIG, GLM_CONFIG, API_TYPES } = config;
  
  try {
    console.log('开始高级回退流程 - 第一阶段：尝试OpenRouter');
    
    // 首先尝试OpenRouter及其内部回退机制，传递配置
    const openRouterResponse = await callOpenRouterWithFallback(text, options, OPENROUTER_CONFIG);
    
    // OpenRouter成功，返回结果
    return {
      response: openRouterResponse,
      apiType: API_TYPES.OPENROUTER,
      model: openRouterResponse.usedModel,
      fallbackUsed: false
    };
    
  } catch (openRouterError) {
    // 记录OpenRouter失败
    console.error('所有OpenRouter模型均失败，错误信息:', openRouterError);
    console.log('开始高级回退流程 - 第二阶段：尝试外部API');
    
    // 定义外部API回退顺序
    const externalAPIs = [
      {
        type: API_TYPES.GEMINI,
        handler: (text, options) => callGeminiApi(text, options, GEMINI_CONFIG)
      },
      {
        type: API_TYPES.MISTRAL,
        handler: (text, options) => callMistralApi(text, options, false, MISTRAL_CONFIG)
      },
      {
        type: API_TYPES.GLM,
        handler: (text, options) => callGlmApi(text, options, GLM_CONFIG)
      }
    ];
    
    // 依次尝试每个外部API
    for (const api of externalAPIs) {
      try {
        console.log(`尝试回退到外部API: ${api.type}`);
        
        // 使用对应的处理器调用API
        const response = await api.handler(text, options);
        
        // 成功响应，返回结果
        console.log(`成功回退到外部API: ${api.type}`);
        return {
          response: response,
          apiType: api.type,
          fallbackUsed: true,
          originalApiType: API_TYPES.OPENROUTER
        };
        
      } catch (error) {
        console.error(`外部API ${api.type} 调用失败:`, error);
        // 继续尝试下一个外部API
      }
    }
    
    // 所有API都失败，抛出全局错误
    throw new Error('所有可用的AI服务都调用失败，无法处理请求');
  }
}

/**
 * 调用Gemini API
 * @private
 */
async function callGeminiApi(text, options = {}, config) {
  const { apiKey, endpoint } = config;
  
  console.log('调用Gemini API');
  
  const data = {
    contents: [{
      parts: [{ text }]
    }],
    ...options
  };

  try {
    const url = `${endpoint}?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API 错误 (${response.status}): ${errorData.error?.message || response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Gemini API调用失败:', error);
    throw error;
  }
}

/**
 * 调用GLM API
 * @private
 */
async function callGlmApi(text, options = {}, config) {
  const { apiKey, endpoint, model, defaultParams } = config;
  
  console.log('调用GLM API');
  
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
      throw new Error(`GLM API 错误 (${response.status}): ${errorData.error?.message || response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('GLM API调用失败:', error);
    throw error;
  }
}

/**
 * 调用Mistral API
 * @private
 */
async function callMistralApi(text, options = {}, usePixtral = false, config) {
  const { apiKey, endpoint, models, defaultParams } = config;
  
  // 选择Mistral模型
  const model = usePixtral ? models.pixtral : models.small;
  console.log(`调用Mistral API，使用模型: ${model}`);
  
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
      throw new Error(`Mistral API 错误 (${response.status}): ${errorData.error?.message || response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Mistral API调用失败:', error);
    throw error;
  }
}