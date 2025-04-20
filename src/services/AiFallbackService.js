/**
 * AI高级回退服务
 * 实现多级回退策略：OpenRouter失败后回退到其他外部API
 */
import { callOpenRouterWithFallback } from './openRouterService';
import { getAllProviders } from './api/ApiRegistry';

/**
 * 使用高级回退策略调用AI服务
 * @param {string} text - 发送给AI的文本提示
 * @param {object} options - 额外配置选项
 * @param {object} config - 包含所有API配置的对象
 * @returns {Promise<object>} - 带有响应和元数据的对象
 */
export async function executeWithFallbackStrategy(text, options = {}, config) {
  const { OPENROUTER_CONFIG, API_TYPES } = config;
  
  try {
    console.log('开始高级回退流程 - 第一阶段：尝试OpenRouter');
    
    // 首先尝试OpenRouter及其内部回退机制
    const openRouterResponse = await callOpenRouterWithFallback(text, options, OPENROUTER_CONFIG);
    
    // OpenRouter成功，返回结果
    return {
      response: openRouterResponse,
      apiType: API_TYPES.OPENROUTER,
      model: openRouterResponse.usedModel,
      fallbackUsed: false
    };
    
  } catch (openRouterError) {
    // 记录OpenRouter失败
    console.error('所有OpenRouter模型均失败，错误信息:', openRouterError);
    console.log('开始高级回退流程 - 第二阶段：尝试外部API');
    
    // 获取所有非OpenRouter的提供者
    const providers = Object.values(getAllProviders())
      .filter(p => p.type !== 'openrouter');
    
    // 优先级排序：按照预定义顺序
    const priorityOrder = ['gemini', 'mistral', 'glm','xai'];
    providers.sort((a, b) => {
      const indexA = priorityOrder.indexOf(a.type);
      const indexB = priorityOrder.indexOf(b.type);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    // 依次尝试每个外部API
    for (const provider of providers) {
      try {
        console.log(`尝试回退到外部API: ${provider.name}`);
        
        // 获取该提供者的配置
        const providerConfig = config[`${provider.type.toUpperCase()}_CONFIG`];
        if (!providerConfig) {
          console.warn(`未找到 ${provider.name} 的配置，跳过`);
          continue;
        }
        
        // 使用提供者调用API
        const response = await provider.callApi(text, options);
        
        // 成功响应，返回结果
        console.log(`成功回退到外部API: ${provider.name}`);
        return {
          response: response,
          apiType: provider.type,
          fallbackUsed: true,
          originalApiType: 'openrouter'
        };
        
      } catch (error) {
        console.error(`外部API ${provider.name} 调用失败:`, error);
        // 继续尝试下一个外部API
      }
    }
    
    // 所有API都失败，抛出全局错误
    throw new Error('所有可用的AI服务都调用失败，无法处理请求');
  }
}