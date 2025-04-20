/**
 * Central configuration for all AI API settings
 * This file allows for easy management of API keys and endpoints
 */

// GLM API Configuration
export const GLM_CONFIG = {
  apiKey: process.env.REACT_APP_GLM_API_KEY,
  endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  model: 'glm-4-flash',
  defaultParams: {
    max_tokens: 200,
    temperature: 0.7
  }
};

// Gemini API Configuration
export const GEMINI_CONFIG = {
  apiKey: process.env.REACT_APP_GEMINI_API_KEY,
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent',
  defaultParams: {}
};

// Mistral API Configuration
export const MISTRAL_CONFIG = {
  apiKey: process.env.REACT_APP_MISTRAL_API_KEY,
  endpoint: 'https://api.mistral.ai/v1/chat/completions',
  models: {
    small: 'mistral-small-latest',
    pixtral: 'pixtral-12b-2409'
  },
  defaultModel: 'mistral-small-latest',
  defaultParams: {
    max_tokens: 1000,
    temperature: 0.7
  }
};

// OpenRouter API Configuration
export const OPENROUTER_CONFIG = {
  apiKey: process.env.REACT_APP_OPENROUTER_API_KEY,
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  model: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
  // 添加备用模型列表，用于当主模型失败时
  fallbackModels: [
    'deepseek/deepseek-r1:free',
    'qwen/qwen-2.5-7b-instruct:free',
    'nvidia/llama-3.3-nemotron-super-49b-v1:free',
    'deepseek/deepseek-chat-v3-0324:free'
  ],
  siteUrl: 'https://lazydog-app.com', // 使用固定字符串避免window.location问题
  siteName: 'LazyDog Speech Recognition',
  defaultParams: {
    max_tokens: 1000,
    temperature: 0.7,
    stream: false // 显式禁用流式传输以避免问题
  }
};

// Available API types
// xAI/Grok API Configuration
export const XAI_CONFIG = {
  apiKey: process.env.REACT_APP_XAI_API_KEY,
  endpoint: 'https://api.x.ai/v1/chat/completions',
  model: 'grok-3-mini-beta',
  defaultParams: {
    temperature: 0,
    stream: false
  }
};

// Then add to API_TYPES
export const API_TYPES = {
  GLM: 'glm',
  GEMINI: 'gemini', 
  MISTRAL: 'mistral',
  MISTRAL_PIXTRAL: 'mistral_pixtral',
  OPENROUTER: 'openrouter',
  XAI: 'xai'  // Add this line
};
// Default settings
export const DEFAULT_API = API_TYPES.XAI; // Setting OpenRouter as the default API