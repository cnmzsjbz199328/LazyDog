/**
 * xAI/Grok API提供者插件
 */
import { XAI_CONFIG } from '../../../config/apiConfig';
import { createApiProvider } from '../ApiProviderInterface';

// 创建xAI API提供者
export default createApiProvider({
  type: 'xai',
  name: 'xAI Grok',
  supportsFallback: false,
  
  // API调用实现
  async callApi(text, options = {}) {
    const { apiKey, endpoint, model, defaultParams } = XAI_CONFIG;
    
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
      console.log(`调用xAI API，使用模型: ${model}`);
      
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
        throw new Error(`xAI API错误 (${response.status}): ${errorData.error?.message || response.statusText}`);
      }
      
      const result = await response.json();
      result.usedApiType = this.type;
      result.usedModel = model;
      return result;
    } catch (error) {
      console.error('xAI API调用失败:', error);
      throw error;
    }
  },
  
  // 响应格式化实现
  formatResponse(response) {
    if (!response || !response.choices || !response.choices[0]) {
      console.error('XAI API 返回了异常结构:', response);
      return { content: '无法获取响应内容', text: '无法获取响应内容', error: true };
    }
    
    try {
      const content = response.choices[0].message.content;
      
      return {
        content: content || '无内容返回',
        text: content || '无内容返回', // 添加这一行，保持与其他provider一致
        rawResponse: response,
        apiType: this.type,
        usedModel: response.usedModel || XAI_CONFIG.model || 'grok-3-mini-beta'
      };
    } catch (error) {
      console.error('XAI formatResponse 错误:', error);
      console.error('问题响应:', JSON.stringify(response).substring(0, 200));
      return { 
        content: '格式化响应时出错', 
        text: '格式化响应时出错', // 添加这一行，保持与其他provider一致
        error: true 
      };
    }
  },
  
  // 获取默认配置
  getDefaultConfig() {
    return { ...XAI_CONFIG };
  }
});