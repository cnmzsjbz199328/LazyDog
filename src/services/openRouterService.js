/**
 * OpenRouter API服务
 * 负责与OpenRouter API交互，包括模型回退机制
 */

/**
 * 调用OpenRouter API，支持模型回退机制
 * @param {string} text - 发送给API的文本
 * @param {object} options - 额外选项
 * @param {object} config - OpenRouter配置对象
 * @returns {Promise<object>} - API响应
 */
export async function callOpenRouterWithFallback(text, options = {}, config) {
  const { apiKey, endpoint, model, fallbackModels, siteUrl, siteName, defaultParams } = config;
  
  // 构建要尝试的模型列表
  let modelsToTry = [model];
  if (fallbackModels && Array.isArray(fallbackModels)) {
    modelsToTry = modelsToTry.concat(fallbackModels.filter(m => m !== model));
  }
  
  let lastError = null;
  
  // 依次尝试每个模型
  for (const currentModel of modelsToTry) {
    console.log(`尝试使用OpenRouter模型: ${currentModel}`);
    
    try {
      const response = await sendOpenRouterRequest(
        endpoint, 
        apiKey, 
        currentModel, 
        text, 
        siteUrl, 
        siteName,
        { ...defaultParams, ...options }
      );
      
      // 在响应中添加使用的模型信息，方便调试
      response.usedModel = currentModel;
      return response;
    } catch (error) {
      console.error(`OpenRouter API调用失败，使用模型 ${currentModel}:`, error);
      lastError = error;
      // 继续尝试下一个模型
    }
  }
  
  // 如果所有模型都失败，抛出最后一个错误
  if (lastError) {
    throw lastError;
  } else {
    throw new Error('所有OpenRouter模型都无法返回有效响应');
  }
}

/**
 * 发送单个OpenRouter API请求
 * @param {string} endpoint - API端点
 * @param {string} apiKey - API密钥
 * @param {string} model - 使用的模型
 * @param {string} text - 提示文本
 * @param {string} siteUrl - 站点URL
 * @param {string} siteName - 站点名称
 * @param {object} params - 其他参数
 * @returns {Promise<object>} - 处理后的API响应
 */
async function sendOpenRouterRequest(endpoint, apiKey, model, text, siteUrl, siteName, params = {}) {
  const data = {
    model,
    messages: [
      {
        role: 'user',
        content: text
      }
    ],
    ...params
  };

  const fetchResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl || 'https://lazydog-app.com',
      'X-Title': siteName || 'LazyDog Speech Recognition',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!fetchResponse.ok) {
    const errorText = await fetchResponse.text();
    console.error(`OpenRouter API 使用模型 ${model} 出错 (${fetchResponse.status}):`, errorText);
    throw new Error(`OpenRouter API 错误 (${fetchResponse.status}): ${fetchResponse.statusText}`);
  }
  
  const responseJson = await fetchResponse.json();
  
  // 检查响应中是否有明确的错误
  if (responseJson?.choices?.[0]?.error) {
    console.error(`模型 ${model} 返回错误:`, responseJson.choices[0].error);
    throw new Error(`提供商错误: ${responseJson.choices[0].error.message}`);
  }
  
  // 检查是否有内容返回（空内容也算失败）
  if (!responseJson?.choices?.[0]?.message?.content || 
      responseJson.choices[0].message.content.trim() === '') {
    console.error(`模型 ${model} 返回空内容`);
    throw new Error('提供商返回空响应');
  }
  
  // 成功获取响应
  console.log(`成功使用OpenRouter模型: ${model}`);
  return responseJson;
}