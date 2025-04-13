/**
 * 调整SVG尺寸以适应容器
 * @param {SVGElement} svgElement - SVG元素
 * @param {boolean} isModal - 是否在模态框中
 */
export const adjustSvgSize = (svgElement, isModal = false) => {
  if (!svgElement) return;
  
  svgElement.style.width = '100%';
  
  if (isModal) {
    svgElement.style.height = 'auto';
    svgElement.style.maxHeight = '100%';
  } else {
    svgElement.style.height = '100%';
  }
  
  // 添加平滑过渡
  svgElement.style.transition = 'all 0.3s ease';
};

/**
 * 清理容器内容
 * @param {HTMLElement} container - 容器元素
 */
export const clearContainer = (container) => {
  if (container) {
    container.innerHTML = '';
  }
};