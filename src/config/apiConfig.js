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
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
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

// Available API types
export const API_TYPES = {
  GLM: 'glm',
  GEMINI: 'gemini', 
  MISTRAL: 'mistral',
  MISTRAL_PIXTRAL: 'mistral_pixtral'
};

// Default settings
export const DEFAULT_API = API_TYPES.GEMINI; // Which API to use by default