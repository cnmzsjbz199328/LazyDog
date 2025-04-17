import { useEffect } from 'react';
import { renderMermaidDiagram } from '../utils/mermaidHelper';
import { extractMermaidCode } from '../utils/codeExtractor';

/**
 * 思维导图渲染钩子
 * 处理SVG渲染和DOM操作
 */
export const useMindMapRenderer = ({ show, svgContent, containerRef, isProcessing }) => {
  // 处理页面滚动锁定
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [show]);
  
  // 渲染SVG
  useEffect(() => {
    if (!show || !containerRef?.current || !svgContent || isProcessing) return;
    
    console.log('模态框显示，准备渲染SVG');
    
    const timer = setTimeout(async () => {
      try {
        // 尝试提取Mermaid代码
        const mermaidCode = extractMermaidCode(svgContent);
        
        if (mermaidCode) {
          // 使用Mermaid渲染
          await renderMermaidDiagram(
            mermaidCode,
            containerRef.current,
            true,
            true
          );
          console.log('交互式思维导图渲染完成');
        } else {
          // 回退到非交互模式
          console.log('使用非交互式模式');
          containerRef.current.innerHTML = svgContent;
          
          // 手动添加交互功能
          addInteractivityToSvg(containerRef.current);
        }
      } catch (error) {
        console.error('渲染出错:', error);
        containerRef.current.innerHTML = svgContent;
        addInteractivityToSvg(containerRef.current);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [show, svgContent, containerRef, isProcessing]);
};

/**
 * 为SVG添加交互性
 */
async function addInteractivityToSvg(container) {
  setTimeout(async () => {
    const svgElement = container.querySelector('svg');
    if (!svgElement) return;
    
    try {
      const { adjustSvgElement, addNodeInteractivity } = await import('../utils/svgHelper');
      
      // 调整SVG样式
      adjustSvgElement(svgElement, true);
      
      // 添加交互功能
      addNodeInteractivity(svgElement);
    } catch (err) {
      console.error('添加交互性时出错:', err);
    }
  }, 150);
}