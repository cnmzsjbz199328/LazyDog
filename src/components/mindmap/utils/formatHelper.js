/**
 * 获取默认思维导图内容
 */
export const getDefaultMindMapContent = () => {
  return `flowchart TD
    root["Mind Map"] --> basicFunc["Basic Functions"]
    root --> structure["Structure & Layout"]
    root --> visual["Visual Effects"]
    basicFunc --> createNode["Node Creation"]
    basicFunc --> editNode["Node Editing"]
    structure --> hLayout["Horizontal Layout"]
    structure --> vLayout["Vertical Layout"]
    visual --> themes["Theme Colors"]
    visual --> shapes["Node Shapes"]`;
};

/**
 * 转换mindmap格式为垂直树形格式(flowchart TD)
 * @param {string} content - 原始思维导图代码
 * @param {string} mainPoint - 主要主题/标题
 * @returns {string} - 转换后的代码
 */
export const convertToVerticalTreeFormat = (content, mainPoint) => {
  // 只转换mindmap格式
  if (!content || !content.includes('mindmap')) {
    return content;
  }

  console.log("Converting from mindmap to flowchart format...");
  
  let lines = content.split('\n');
  let result = ['flowchart TD'];
  let nodeMap = {};
  let nodeCounter = 0;
  let lastNodeAtLevel = {};
  
  // 跳过mindmap行，保留非空行
  lines = lines.filter(line => line.trim() !== 'mindmap' && line.trim() !== '');
  
  // 首先识别根节点
  let rootNodeId = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line.trim();
    
    // 优化根节点识别，确保使用mainPoint
    const rootMatch = text.match(/root\(\((.*?)\)\)/);
    if (rootMatch || (line.search(/\S/) === 2 && i === 0)) {
      const rootId = `node${nodeCounter++}`;
      // 如果找到根节点匹配，使用匹配内容；否则强制使用mainPoint
      const rootContent = rootMatch ? rootMatch[1] : mainPoint;
      
      result.push(`    ${rootId}["${rootContent}"]`);
      nodeMap[rootId] = { level: 0, text: rootContent };
      lastNodeAtLevel[0] = rootId;
      rootNodeId = rootId;
      
      // 移除已处理的根节点
      lines.splice(i, 1);
      i--;
      break;
    }
  }
  
  // 如果未找到根节点，确保使用mainPoint创建一个
  if (!rootNodeId) {
    const defaultRootId = `node${nodeCounter++}`;
    result.push(`    ${defaultRootId}["${mainPoint || 'Mind Map'}"]`);
    nodeMap[defaultRootId] = { level: 0, text: mainPoint || 'Mind Map' };
    lastNodeAtLevel[0] = defaultRootId;
    rootNodeId = defaultRootId;
  }
  
  // 处理剩余节点
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.search(/\S|$/);
    // 计算层级：每2个空格算一级
    const level = indent === 0 ? 1 : Math.ceil(indent / 2); 
    const text = line.trim();
    
    if (!text) continue;
    
    // 创建节点ID
    const nodeId = `node${nodeCounter++}`;
    
    // 存储当前节点
    nodeMap[nodeId] = { level, text };
    
    // 查找父节点(上一级的最后一个节点)
    let parentId = null;
    
    // 查找最近的父节点
    for (let l = level - 1; l >= 0; l--) {
      if (lastNodeAtLevel[l]) {
        parentId = lastNodeAtLevel[l];
        break;
      }
    }
    
    // 如果没有找到父节点，连接到根节点
    if (!parentId) {
      parentId = rootNodeId;
    }
    
    // 添加连接
    result.push(`    ${parentId} --> ${nodeId}["${text}"]`);
    
    // 更新当前级别的最后一个节点
    lastNodeAtLevel[level] = nodeId;
  }
  
  const flowchartCode = result.join('\n');
  console.log("Conversion complete");
  return flowchartCode;
};

/**
 * 确保代码是 flowchart TD 格式
 * @param {string} content - 原始代码
 * @param {string} mainPoint - 主要主题
 * @returns {string} - 标准格式的代码
 */
export const ensureFlowchartFormat = (content, mainPoint) => {
  // 如果已经是flowchart格式，则按原样返回
  if (!content) return getDefaultMindMapContent();
  if (content.includes('flowchart TD')) return content;
  
  return convertToVerticalTreeFormat(content, mainPoint);
};