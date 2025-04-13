import { ensureFlowchartFormat } from './formatHelper';
import { adjustSvgElement } from './svgHelper';

/**
 * 初始化Mermaid库
 */
export const initializeMermaid = () => {
  if (!window.mermaid) return false;
  
  window.mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    flowchart: {
      curve: 'basis',
      nodeSpacing: 50,
      rankSpacing: 70,
      useMaxWidth: true,
      htmlLabels: true
    },
    securityLevel: 'loose'
  });

  return true;
};

/**
 * 渲染Mermaid图表
 * @param {string} code - Mermaid图表代码
 * @param {HTMLElement|React.RefObject} container - 目标容器或引用
 * @param {boolean} isModal - 是否在模态框中渲染
 * @returns {Promise<string>} - 渲染后的SVG内容
 */
export const renderMermaidDiagram = async (code, container, isModal = false) => {
  if (!window.mermaid || !code) return null;

  try {
    const uniqueId = `mindmap-${Date.now()}`;
    const formattedCode = ensureFlowchartFormat(code);
    
    // 渲染图表
    const { svg } = await window.mermaid.render(uniqueId, formattedCode);
    
    // 如果传入的是DOM元素
    if (container instanceof HTMLElement) {
      container.innerHTML = svg;
      const svgElement = container.querySelector('svg');
      if (svgElement) {
        adjustSvgElement(svgElement, isModal);
      }
    } 
    // 如果传入的是React引用
    else if (container && container.current) {
      container.current.innerHTML = svg;
      const svgElement = container.current.querySelector('svg');
      if (svgElement) {
        adjustSvgElement(svgElement, isModal);
      }
    }
    
    return svg;
  } catch (err) {
    console.error('Mind map rendering error:', err);
    return null;
  }
};