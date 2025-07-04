import { ensureFlowchartFormat } from './formatHelper';
import { adjustSvgElement, addNodeInteractivity } from './svgHelper';

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
 * @param {boolean} interactive - 是否启用交互功能
 * @returns {Promise<string>} - 渲染后的SVG内容
 */
export const renderMermaidDiagram = async (code, container, isModal = false, interactive = false) => {
  if (!window.mermaid || !code) {
    console.error('无法渲染Mermaid图表: mermaid库不可用或代码为空');
    return null;
  }

  try {
    const uniqueId = `mindmap-${Date.now()}`;
    
    const formattedCode = ensureFlowchartFormat(code);
    
    // 渲染图表
    console.log('调用mermaid.render方法');
    const { svg } = await window.mermaid.render(uniqueId, formattedCode);
    
    // 如果传入的是DOM元素
    if (container instanceof HTMLElement) {
      container.innerHTML = svg;
      const svgElement = container.querySelector('svg');
      
      if (svgElement) {
        adjustSvgElement(svgElement, isModal);
        
        // 如果启用交互功能，为节点添加点击事件
        if (interactive) {
          // 短暂延迟确保DOM完全加载
          setTimeout(() => {
            addNodeInteractivity(svgElement);
          }, 50);
        }
      } else {
        console.warn('渲染后未找到SVG元素');
      }
    } 
    // 如果传入的是React引用
    else if (container && container.current) {
      container.current.innerHTML = svg;
      const svgElement = container.current.querySelector('svg');
      
      if (svgElement) {
        adjustSvgElement(svgElement, isModal);
        
        // 如果启用交互功能，为节点添加点击事件
        if (interactive) {
          // 短暂延迟确保DOM完全加载
          setTimeout(() => {
            addNodeInteractivity(svgElement);
          }, 50);
        }
      } else {
        console.warn('渲染后未找到SVG元素');
      }
    } else {
      console.warn('无效的容器:', container);
    }
    
    return svg;
  } catch (err) {
    console.error('思维导图渲染错误:', err);
    return null;
  }
};