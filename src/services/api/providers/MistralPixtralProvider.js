/**
 * Mistral Pixtral API提供者插件
 * 使用Mistral的Pixtral模型，专为处理图像设计
 */
import { MISTRAL_CONFIG } from '../../../config/apiConfig';
import { createApiProvider } from '../ApiProviderInterface';

// 创建Mistral Pixtral API提供者
export default createApiProvider({
  type: 'mistral_pixtral',
  name: 'Mistral Pixtral',
  supportsFallback: false,
  
  // API调用实现
  async callApi(text, options = {}) {
    const { apiKey, endpoint, models, defaultParams } = MISTRAL_CONFIG;
    const model = models.pixtral; // 使用Pixtral模型
    
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
      console.log(`调用Mistral Pixtral API，使用模型: ${model}`);
      
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
        throw new Error(`Mistral Pixtral API错误 (${response.status}): ${errorData.error?.message || response.statusText}`);
      }
      
      const result = await response.json();
      result.usedApiType = this.type;
      result.usedModel = model;
      return result;
    } catch (error) {
      console.error('Mistral Pixtral API调用失败:', error);
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
        usedModel: response.usedModel || 'pixtral-12b-2409'
      };
    }
    
    throw new Error('Mistral Pixtral API返回格式不符合预期');
  },
  
  // 获取默认配置
  getDefaultConfig() {
    return MISTRAL_CONFIG; // 使用相同的配置，只是内部使用不同的模型
  }
});