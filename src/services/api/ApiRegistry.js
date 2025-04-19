/**
 * API提供者注册中心
 * 负责管理所有可用的API提供者
 */
import GeminiProvider from './providers/GeminiProvider';
import MistralProvider from './providers/MistralProvider';
import MistralPixtralProvider from './providers/MistralPixtralProvider';
import GlmProvider from './providers/GlmProvider';
import OpenRouterProvider from './providers/OpenRouterProvider';

// Add import
import XaiProvider from './providers/XaiProvider';

// Update providers collection
const providers = {
  [GeminiProvider.type]: GeminiProvider,
  [MistralProvider.type]: MistralProvider,
  [MistralPixtralProvider.type]: MistralPixtralProvider,
  [GlmProvider.type]: GlmProvider,
  [OpenRouterProvider.type]: OpenRouterProvider,
  [XaiProvider.type]: XaiProvider  // Add this line
};

/**
 * 获取所有注册的API提供者
 * @returns {Object} 所有注册的API提供者
 */
export const getAllProviders = () => {
  return { ...providers };
};

/**
 * 获取指定类型的API提供者
 * @param {string} type - API类型
 * @returns {Object|null} API提供者或null
 */
export const getProvider = (type) => {
  return providers[type.toLowerCase()] || null;
};

/**
 * 注册新的API提供者
 * @param {Object} provider - API提供者实现
 * @returns {boolean} 是否注册成功
 */
export const registerProvider = (provider) => {
  if (!provider || !provider.type) {
    console.error('无效的API提供者');
    return false;
  }
  
  // 检查是否已存在
  if (providers[provider.type]) {
    console.warn(`API提供者 ${provider.type} 已存在，将被替换`);
  }
  
  providers[provider.type] = provider;
  return true;
};

/**
 * 获取所有API类型
 * @returns {Object} API类型常量对象
 */
export const API_TYPES = Object.keys(providers).reduce((types, type) => {
  types[type.toUpperCase()] = type;
  return types;
}, {});

/**
 * 获取默认API类型
 * @returns {string} 默认API类型
 */
export const DEFAULT_API = API_TYPES.XAI;