/**
 * 调整SVG元素尺寸和样式
 * @param {SVGElement} svgElement - SVG元素
 * @param {Object} options - 配置选项
 */
export const adjustSvgElement = (svgElement, { isModal = false } = {}) => {
  if (!svgElement) return;
  
  svgElement.style.width = '100%';
  
  if (isModal) {
    // 模态框中的SVG样式
    svgElement.style.height = 'auto';
    svgElement.style.maxHeight = '100%';
  } else {
    // 普通显示的SVG样式
    svgElement.style.height = '100%';
  }
};

/**
 * 复制SVG内容到目标容器并调整样式
 * @param {string} svgContent - SVG内容
 * @param {HTMLElement} targetElement - 目标DOM元素
 * @param {Object} options - 配置选项
 * @returns {boolean} - 是否成功
 */
export const copySvgToElement = (svgContent, targetElement, options = {}) => {
  if (!svgContent || !targetElement) return false;
  
  // 清空目标元素
  targetElement.innerHTML = '';
  
  // 设置SVG内容
  targetElement.innerHTML = svgContent;
  
  // 调整SVG尺寸
  const svgElement = targetElement.querySelector('svg');
  adjustSvgElement(svgElement, options);
  
  return true;
};