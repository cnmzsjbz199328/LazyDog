/**
 * Gemini API提供者插件
 */
import { GEMINI_CONFIG } from '../../../config/apiConfig';
import { createApiProvider } from '../ApiProviderInterface';

// 创建Gemini API提供者
export default createApiProvider({
  type: 'gemini',
  name: 'Google Gemini',
  supportsFallback: false,
  
  // API调用实现
  async callApi(text, options = {}) {
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
      
      const result = await response.json();
      result.usedApiType = this.type;
      return result;
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  },
  
  // 响应格式化实现
  formatResponse(response) {
    if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return {
        text: response.candidates[0].content.parts[0].text.trim(),
        rawResponse: response,
        apiType: this.type
      };
    }
    
    throw new Error('Gemini API返回格式不符合预期');
  },
  
  // 获取默认配置
  getDefaultConfig() {
    return GEMINI_CONFIG;
  }
});