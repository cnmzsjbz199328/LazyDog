/**
 * OpenRouter API提供者插件
 */
import { OPENROUTER_CONFIG } from '../../../config/apiConfig';
import { createApiProvider } from '../ApiProviderInterface';
import { callOpenRouterWithFallback } from '../../openRouterService';

// 创建OpenRouter API提供者
export default createApiProvider({
  type: 'openrouter',
  name: 'OpenRouter',
  supportsFallback: true,
  
  // API调用实现
  async callApi(text, options = {}) {
    try {
      const response = await callOpenRouterWithFallback(text, options, OPENROUTER_CONFIG);
      response.usedApiType = this.type;
      return response;
    } catch (error) {
      console.error('OpenRouter API call failed:', error);
      throw error;
    }
  },
  
  // 响应格式化实现
  formatResponse(response) {
    if (response?.choices?.[0]?.message?.content) {
      return {
        text: response.choices[0].message.content.trim(),
        rawResponse: response,
        apiType: this.type,
        usedModel: response.usedModel
      };
    } else if (response?.choices?.[0]?.content) {
      return {
        text: response.choices[0].content.trim(),
        rawResponse: response,
        apiType: this.type,
        usedModel: response.usedModel
      };
    }
    
    throw new Error('OpenRouter API返回格式不符合预期');
  },
  
  // 获取默认配置
  getDefaultConfig() {
    return OPENROUTER_CONFIG;
  }
});