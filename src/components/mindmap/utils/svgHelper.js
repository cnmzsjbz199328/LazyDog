/**
 * SVG 辅助函数集合
 * 用于处理思维导图 SVG 元素
 */

/**
 * 调整 SVG 元素大小
 * @param {SVGElement} svgElement - SVG 元素
 * @param {boolean} isModal - 是否在模态框内
 */
export const adjustSvgElement = (svgElement, isModal = false) => {
  if (!svgElement) return;
  
  // 设置基本样式
  svgElement.style.width = '100%';
  svgElement.style.height = '100%';
  svgElement.style.maxWidth = '100%';
  
  // 如果是模态框，设置更大的尺寸
  if (isModal) {
    svgElement.style.minHeight = '500px';
    svgElement.style.maxHeight = '80vh';
  }
};

/**
 * 为思维导图节点添加交互事件
 * @param {SVGElement} svgElement - SVG 元素
 */
export const addNodeInteractivity = (svgElement) => {
  if (!svgElement) {
    console.error('SVG元素不存在, 无法添加交互性');
    return;
  }
  
  // 优先使用.node选择器，它通常包含所有需要交互的节点
  let elementsToUse = Array.from(svgElement.querySelectorAll('.node'));
  
  // 仅当找不到.node节点时才尝试其他选择器
  if (elementsToUse.length === 0) {
    elementsToUse = Array.from(svgElement.querySelectorAll('.flowchart-node, g[id^="flowchart-"]'));
  }
  
  elementsToUse.forEach((node, index) => {
    addClickEventToElement(node);
  });

  function addClickEventToElement(node) {
    // 添加视觉反馈样式
    node.style.cursor = 'pointer';
    
    // 添加悬停效果
    node.addEventListener('mouseover', () => {
      node.style.opacity = '0.8';
    });
    
    node.addEventListener('mouseout', () => {
      node.style.opacity = '1';
    });
    
    // 添加点击事件
    node.addEventListener('click', (e) => {
      console.log(`节点被点击: ${node.id || 'unknown-id'}`);
      e.stopPropagation(); // 阻止事件冒泡
      
      // 获取节点 ID 和文本内容
      const nodeId = node.id || `node-${Date.now()}`;
      
      // 获取节点文本
      const nodeLabel = node.querySelector('.nodeLabel');
      const nodeText = nodeLabel ? nodeLabel.textContent.trim() : (node.textContent || 'Unknown').trim();
      
      // 创建和分发自定义事件
      const customEvent = new CustomEvent('mindmap-node-click', {
        detail: { nodeId, nodeText }
      });

      window.dispatchEvent(customEvent);
    });
    
    // 添加一些可视化效果，帮助用户识别可点击的元素
    node.setAttribute('data-interactive', 'true');
  }
};