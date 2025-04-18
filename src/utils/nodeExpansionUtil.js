import { callAI, formatResponse } from '../services/aiManagement';

/**
 * 将节点扩展结果保存到localStorage
 * @param {string} nodeId - 被扩展节点的ID
 * @param {string} nodeText - 被扩展节点的文本
 * @param {Array} childNodes - 生成的子节点列表
 */
const saveNodeExpansionResult = (nodeId, nodeText, childNodes) => {
  try {
    const expansionKey = `node_expansion_${nodeId}`;
    const expansionData = {
      parentNode: { id: nodeId, text: nodeText },
      childNodes: childNodes,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(expansionKey, JSON.stringify(expansionData));
    console.log(`扩展结果已保存: ${nodeId} - ${childNodes.length} 个子节点`);
  } catch (err) {
    console.error('保存节点扩展结果失败:', err);
  }
};

/**
 * 获取已缓存的节点扩展结果
 * @param {string} nodeId - 节点ID
 * @returns {Object|null} 缓存的扩展结果或null
 */
export const getCachedExpansion = (nodeId) => {
  try {
    const expansionKey = `node_expansion_${nodeId}`;
    const cached = localStorage.getItem(expansionKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (err) {
    console.error('获取节点扩展缓存失败:', err);
    return null;
  }
};

/**
 * 基于节点文本和上下文生成子节点
 * @param {Object} params - 参数对象
 * @param {string} params.nodeText - 当前节点文本
 * @param {string} params.nodeId - 当前节点ID
 * @param {string} params.originalMindMapCode - 原始思维导图代码
 * @param {string} params.backgroundInfo - 背景信息
 * @param {Array} params.mainPoints - 主要观点列表
 * @param {Array} params.nodeHierarchy - 节点层级结构
 * @param {function} params.onSuccess - 成功回调(childNodes)
 * @param {function} params.onError - 失败回调(error)
 * @param {function} params.onProcessing - 处理状态回调(isProcessing)
 */
export const expandNode = async ({
  nodeText,
  nodeId,
  originalMindMapCode, 
  backgroundInfo,
  mainPoints,
  nodeHierarchy,
  onSuccess,
  onError,
  onProcessing
}) => {
  // 设置处理状态
  if (onProcessing) {
    onProcessing(true);
  }
  
  // 1. 检查缓存
  const cachedExpansion = getCachedExpansion(nodeId);
  if (cachedExpansion) {
    console.log(`使用节点 ${nodeId} 的缓存扩展结果`);
    
    if (onProcessing) onProcessing(false);
    if (onSuccess) onSuccess(cachedExpansion.childNodes);
    
    return cachedExpansion.childNodes;
  }
  
  // 2. 准备参数 - 统一处理可能的undefined值
  const safeText = nodeText || 'Unknown Node';
  const safeBackground = backgroundInfo || '';
  const safeMainPoints = Array.isArray(mainPoints) ? mainPoints : [];
  const safeHierarchy = Array.isArray(nodeHierarchy) ? nodeHierarchy : [];
  
  try {
    // 3. 构建提示内容
    const promptText = buildNodeExpansionPrompt({
      nodeText: safeText,
      originalMindMapCode,
      backgroundInfo: safeBackground,
      mainPoints: safeMainPoints,
      nodeHierarchy: safeHierarchy
    });
    
    // 4. 调用AI API
    console.log(`请求扩展节点: "${safeText}"`);
    const response = await callAI(promptText);
    const formattedResponse = formatResponse(response);
    
    // 5. 解析响应
    const childNodes = parseNodeExpansionResponse(formattedResponse.text);
    
    // 6. 保存结果
    saveNodeExpansionResult(nodeId, nodeText, childNodes);
    
    // 7. 返回结果
    if (onSuccess) onSuccess(childNodes);
    console.log(`节点 "${safeText}" 扩展成功, 生成 ${childNodes.length} 个子节点`);
    
    return childNodes;
  } catch (error) {
    console.error(`扩展节点失败: "${safeText}"`, error);
    
    if (onError) onError(error);
    
    // 返回空数组表示失败
    return [];
  } finally {
    // 设置处理完成状态
    if (onProcessing) {
      onProcessing(false);
    }
  }
};

/**
 * 构建节点扩展的AI提示
 * @param {Object} params - 构建提示所需的参数
 * @returns {string} 构建好的提示文本
 * @private
 */
function buildNodeExpansionPrompt({ 
  nodeText, 
  originalMindMapCode,
  backgroundInfo,
  mainPoints,
  nodeHierarchy
}) {
  // 构建上下文部分
  let contextParts = [];
  
  // 添加背景信息
  if (backgroundInfo && backgroundInfo.trim()) {
    contextParts.push(`背景信息:\n${backgroundInfo}`);
  }
  
  // 添加主要观点
  if (mainPoints && mainPoints.length > 0) {
    const mainPointsText = mainPoints.map((point, index) => `${index+1}. ${point}`).join('\n');
    contextParts.push(`主要观点:\n${mainPointsText}`);
  }
  
  // 添加节点层级
  if (nodeHierarchy && nodeHierarchy.length > 0) {
    const hierarchyPath = nodeHierarchy
      .map(node => node.text)
      .join(' → ');
    
    contextParts.push(`当前节点层级路径: ${hierarchyPath}`);
  }
  
  // 添加当前思维导图结构
  if (originalMindMapCode && originalMindMapCode.trim()) {
    const codePreview = originalMindMapCode.length > 1000 
      ? originalMindMapCode.slice(0, 1000) + '...' 
      : originalMindMapCode;
    
    contextParts.push(`当前思维导图结构:\n${codePreview}`);
  }
  
  // 合并上下文信息
  const contextSection = contextParts.length > 0
    ? `以下是相关背景和上下文信息:\n\n${contextParts.join('\n\n')}`
    : '';
  
  // 构建最终提示
  return `请为思维导图中的节点 "${nodeText}" 生成3-5个相关的子节点。
${contextSection}

请根据节点内容和上下文信息，返回与 "${nodeText}" 直接相关的子节点列表。
返回格式要求:
1. 仅返回JSON数组，不要任何额外说明或解释
2. 每个对象只包含 "text" 字段，表示节点标题
3. 节点标题应简洁、明确，不超过30个字符
4. JSON格式必须正确且无语法错误
5. 不要使用Markdown格式

下面是期望的返回格式示例:
[
  {"text": "子节点A"},
  {"text": "子节点B"},
  {"text": "子节点C"},
  {"text": "子节点D"}
]`;
}

/**
 * 解析节点扩展的AI响应
 * @param {string} responseText - AI返回的响应文本
 * @returns {Array} 解析后的子节点数组
 * @private
 */
function parseNodeExpansionResponse(responseText) {
  try {
    // 尝试查找和提取JSON部分
    const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;
    
    // 清理文本
    const cleanedText = jsonText
      .replace(/```(?:json)?|```/g, '')  // 移除可能的代码块标记
      .trim();
    
    // 解析JSON
    const parsedNodes = JSON.parse(cleanedText);
    
    // 验证数据结构
    if (!Array.isArray(parsedNodes)) {
      throw new Error('响应不是有效的数组');
    }
    
    // 验证每个节点并标准化
    return parsedNodes.map((node, index) => {
      // 确保每个节点至少有text属性
      if (!node || typeof node !== 'object' || !node.text) {
        return { 
          text: `子节点 ${index + 1}`
        };
      }
      
      // 标准化节点 - 只返回text字段
      return {
        text: node.text.trim()
      };
    });
  } catch (error) {
    console.error('解析节点扩展响应失败:', error);
    
    // 返回简单的错误节点
    return [
      { text: '解析失败' },
      { text: '请重试' }
    ];
  }
}

/**
 * 将生成的子节点合并到原始思维导图代码中
 * 策略: 删除原节点下的所有分支节点，然后用新节点替换
 * @param {string} originalMindMapCode - 原始的思维导图代码
 * @param {string} nodeText - 要扩展的节点文本
 * @param {Array} childNodes - 生成的子节点列表
 * @returns {string} 更新后的思维导图代码
 */
export const mergeNodeExpansionToMindMap = (originalMindMapCode, nodeText, childNodes) => {
  try {
    if (!originalMindMapCode || !nodeText || !Array.isArray(childNodes) || childNodes.length === 0) {
      return originalMindMapCode;
    }
    
    // 分割为行
    const lines = originalMindMapCode.split('\n');
    
    // 找到目标节点行及其缩进
    let targetIndex = -1;
    let targetIndent = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim().replace(/\(\(|\)\)|"|'/g, '');
      
      if (trimmedLine === nodeText || trimmedLine.includes(nodeText)) {
        targetIndex = i;
        targetIndent = line.search(/\S|$/);
        break;
      }
    }
    
    if (targetIndex === -1) {
      console.warn(`在思维导图中未找到节点: "${nodeText}"`);
      return originalMindMapCode;
    }
    
    // 计算子节点的缩进 (多两个空格)
    const childIndent = ' '.repeat(targetIndent + 2);
    
    // 创建新的子节点行
    const childLines = childNodes.map(node => 
      `${childIndent}${node.text}`
    );
    
    // 找到当前节点的所有子节点以删除它们
    let linesToRemove = [];
    
    // 从目标节点的下一行开始
    for (let i = targetIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        // 跳过空行
        continue;
      }
      
      const currentIndent = line.search(/\S|$/);
      
      // 如果缩进等于或小于当前节点的缩进，说明已经不是子节点
      if (currentIndent <= targetIndent) {
        break;
      }
      
      // 否则，将该行标记为要删除
      linesToRemove.push(i);
    }
    
    // 删除所有子节点行
    if (linesToRemove.length > 0) {
      console.log(`删除节点 "${nodeText}" 下的 ${linesToRemove.length} 个旧子节点`);
      
      // 计算要删除的行数
      const deleteCount = linesToRemove[linesToRemove.length - 1] - linesToRemove[0] + 1;
      
      // 从第一个子节点行开始删除
      lines.splice(linesToRemove[0], deleteCount);
      
      // 调整插入位置，因为我们刚刚删除了行
      targetIndex = linesToRemove[0] - 1;
    }
    
    // 插入新的子节点
    lines.splice(targetIndex + 1, 0, ...childLines);
    console.log(`为节点 "${nodeText}" 添加了 ${childLines.length} 个新子节点`);
    
    // 合并并返回
    return lines.join('\n');
  } catch (error) {
    console.error('合并扩展节点到思维导图失败:', error);
    return originalMindMapCode;
  }
};