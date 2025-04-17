/**
 * API提供者接口
 * 所有API提供者插件应实现此接口
 */

/**
 * API提供者基本接口
 * @typedef {Object} ApiProviderInterface
 * @property {string} type - API类型标识符
 * @property {string} name - API提供者名称
 * @property {function} callApi - 调用API函数
 * @property {function} formatResponse - 格式化API响应函数
 * @property {boolean} supportsFallback - 是否支持内部回退机制
 * @property {function} [getDefaultConfig] - 获取默认配置
 */

/**
 * 创建标准API提供者接口对象
 * @param {Object} implementation - 接口实现
 * @returns {ApiProviderInterface} API提供者实例
 */
export const createApiProvider = (implementation) => {
  // 必须实现的方法检查
  const requiredMethods = ['type', 'name', 'callApi', 'formatResponse'];
  for (const method of requiredMethods) {
    if (!implementation[method]) {
      throw new Error(`API提供者必须实现 ${method} 方法或属性`);
    }
  }

  return {
    ...implementation,
    // 默认实现，如果提供者没有指定
    supportsFallback: implementation.supportsFallback || false,
    getDefaultConfig: implementation.getDefaultConfig || (() => ({}))
  };
};