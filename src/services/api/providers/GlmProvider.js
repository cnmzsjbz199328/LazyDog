/**
 * 智谱GLM API提供者插件
 */
import { GLM_CONFIG } from '../../../config/apiConfig';
import { createApiProvider } from '../ApiProviderInterface';

// 创建GLM API提供者
export default createApiProvider({
  type: 'glm',
  name: '智谱GLM',
  supportsFallback: false,
  
  // API调用实现
  async callApi(text, options = {}) {
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
      console.log(`调用智谱GLM API，使用模型: ${model}`);
      
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
        throw new Error(`GLM API错误 (${response.status}): ${errorData.error?.message || response.statusText}`);
      }
      
      const result = await response.json();
      result.usedApiType = this.type;
      result.usedModel = model;
      return result;
    } catch (error) {
      console.error('GLM API调用失败:', error);
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
        usedModel: response.usedModel || 'glm-4-flash'
      };
    }
    
    throw new Error('GLM API返回格式不符合预期');
  },
  
  // 获取默认配置
  getDefaultConfig() {
    return GLM_CONFIG;
  }
});