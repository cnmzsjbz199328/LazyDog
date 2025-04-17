/**
 * 从Mermaid代码中分析节点层级关系
 * @param {string} mermaidCode - 原始Mermaid代码
 * @param {string} targetNodeText - 目标节点文本
 * @returns {Array} - 从根节点到目标节点的层级路径
 */
export const analyzeNodeHierarchy = (mermaidCode, targetNodeText) => {
  if (!mermaidCode || !targetNodeText) {
    console.warn('无法分析节点层级: 代码或目标节点为空');
    return [];
  }
  
  try {
    // 分割为行并过滤掉不相关的行
    const lines = mermaidCode.split('\n')
      .filter(line => line.trim() !== '')
      .filter(line => !line.trim().startsWith('mindmap'))
      .map(line => ({
        text: line.trim().replace(/\(\(|\)\)|"|'/g, ''),  // 移除特殊字符
        indent: line.search(/\S|$/) / 2  // 每两个空格为一级缩进
      }));
    
    // 找到目标节点的位置
    const targetNodeIndex = lines.findIndex(line => 
      line.text.toLowerCase().includes(targetNodeText.toLowerCase())
    );
    
    if (targetNodeIndex === -1) {
      console.warn(`未找到目标节点: "${targetNodeText}"`);
      return [];
    }
    
    const targetNode = lines[targetNodeIndex];
    const targetLevel = targetNode.indent;
    const hierarchy = [{ text: targetNode.text, level: targetLevel }];
    
    // 向上查找所有父节点
    for (let i = targetNodeIndex - 1; i >= 0; i--) {
      const currentLine = lines[i];
      
      // 如果当前行的缩进小于已找到的最高层级节点的缩进，则为父节点
      if (currentLine.indent < hierarchy[0].level) {
        hierarchy.unshift({ 
          text: currentLine.text, 
          level: currentLine.indent 
        });
        
        // 如果到达根节点(缩进为0)，则停止搜索
        if (currentLine.indent === 0) {
          break;
        }
      }
    }
    
    console.log('==== 节点层级分析 ====');
    console.log(`找到从根到目标的 ${hierarchy.length} 级路径:`);
    console.log(hierarchy.map(node => `[${node.level}] ${node.text}`).join(' → '));
    
    // 转换为简单格式返回
    return hierarchy.map(node => ({ 
      text: node.text,
      level: node.level
    }));
  } catch (error) {
    console.error('分析节点层级时出错:', error);
    return [];
  }
};