import React, { useEffect, useRef, useState } from 'react';
import { renderMermaidDiagram } from '../utils/mermaidHelper';
import { addNodeInteractivity } from '../utils/svgHelper'; // 修改为正确的函数名

/**
 * 思维导图渲染组件
 * 专门负责思维导图渲染，支持代码渲染和SVG内容展示
 */
const MindMapDisplay = ({ 
  mermaidCode, 
  svgContent, 
  isModal = false, 
  isInteractive = true,
  onRenderComplete,
  onRenderStart
}) => {
  const containerRef = useRef(null);
  const [renderError, setRenderError] = useState(null);
  
  // 处理渲染
  useEffect(() => {
    if (!containerRef.current) return;
    
    async function render() {
      try {
        if (onRenderStart) onRenderStart();
        
        // 清空容器内容，避免叠加
        containerRef.current.innerHTML = '';
        
        // 优先使用Mermaid代码直接渲染
        if (mermaidCode) {
          const renderedSvg = await renderMermaidDiagram(
            mermaidCode, 
            containerRef.current, 
            isModal, 
            isInteractive
          );
          
          if (onRenderComplete && renderedSvg) {
            onRenderComplete(renderedSvg);
          }
        }
        // 其次使用传入的SVG内容
        else if (svgContent) {
          containerRef.current.innerHTML = svgContent;
          
          // 添加交互
          if (isInteractive) {
            const svgElement = containerRef.current.querySelector('svg');
            if (svgElement) {
              // 使用正确的函数名
              addNodeInteractivity(svgElement);
              
              // 添加基本样式
              svgElement.style.width = '100%';
              svgElement.style.height = isModal ? 'auto' : '100%';
              svgElement.style.maxHeight = '100%';
            }
          }
          
          if (onRenderComplete) {
            onRenderComplete(svgContent);
          }
        }
      } catch (error) {
        console.error('思维导图渲染错误:', error);
        setRenderError(error.message);
        
        if (onRenderComplete) {
          onRenderComplete(null, error);
        }
      }
    }
    
    render();
  }, [mermaidCode, svgContent, isModal, isInteractive, onRenderStart, onRenderComplete]);
  
  return (
    <div ref={containerRef} className="mind-map-display" style={{width: '100%', height: '100%', position: 'relative'}}>
      {renderError && (
        <div style={{
          color: '#ff6b6b', 
          padding: '10px',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <i className="fas fa-exclamation-triangle"></i> 渲染错误: {renderError}
        </div>
      )}
    </div>
  );
};

export default MindMapDisplay;