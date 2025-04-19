/**
 * 响应格式化服务
 * 负责将各种API的响应格式化为统一结构
 */
import { API_TYPES } from '../config/apiConfig';

/**
 * Format the API response to a standardized structure
 * @param {object} response - The raw API response
 * @returns {object} - Standardized response object
 */
export const formatResponse = (response) => {
  try {
    // Log the entire response for debugging
    console.log("Formatting response:", JSON.stringify(response, null, 2));
    
    // 从响应中获取使用的API类型
    const apiType = response.usedApiType;
    console.log("API type:", apiType);
    
    // 如果发生了回退，记录日志
    if (response.fallbackUsed) {
      console.log(`API回退发生: ${response.originalApiType} -> ${apiType}`);
    }
    
    // OpenRouter特定的模型信息
    if (response.usedModel) {
      console.log("使用的模型:", response.usedModel);
    }
    
    let formattedText = '';
    let errorMessage = null;
    
    // 根据不同API类型提取内容
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
    }else if (apiType === API_TYPES.XAI) {      
      if (response?.choices?.[0]?.message?.content) {
        formattedText = response.choices[0].message.content.trim();
      }
    }
    else if (apiType === API_TYPES.OPENROUTER) {
      console.log("Processing OpenRouter response");
      
      // For OpenRouter, the structure should match the OpenAI format
      if (response?.choices && response.choices.length > 0) {
        console.log("Found choices array with length:", response.choices.length);
        
        if (response.choices[0]?.message?.content) {
          console.log("Found content in message:", response.choices[0].message.content);
          formattedText = response.choices[0].message.content.trim();
        } else if (response.choices[0]?.content) {
          console.log("Found direct content:", response.choices[0].content);
          formattedText = response.choices[0].content.trim();
        } else {
          console.log("Unexpected choice structure:", JSON.stringify(response.choices[0], null, 2));
          if (response.choices[0]?.error) {
            errorMessage = `OpenRouter错误: ${response.choices[0].error.message || '未知错误'}`;
          }
        }
      } else {
        console.log("No choices array found in response");
      }
    }
    
    // Log the extracted text
    console.log("Extracted text:", formattedText ? formattedText.substring(0, 50) + "..." : "NONE");
    
    // 处理无内容或错误情况
    if (!formattedText) {
      if (errorMessage) {
        return {
          text: "抱歉，处理您的请求时出现了问题。请稍后再试。",
          error: errorMessage,
          rawResponse: response,
          apiType: apiType,
          fallbackUsed: response.fallbackUsed,
          originalApiType: response.originalApiType,
          usedModel: response.usedModel
        };
      }
      console.error('Failed to extract text from response:', JSON.stringify(response, null, 2));
      throw new Error('意外的API响应结构');
    }
    
    // 返回标准格式的响应
    return {
      text: formattedText,
      rawResponse: response,
      apiType: apiType,
      fallbackUsed: response.fallbackUsed,
      originalApiType: response.originalApiType,
      usedModel: response.usedModel
    };
  } catch (error) {
    console.error(`格式化响应时出错:`, error);
    throw error;
  }
};