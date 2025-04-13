import React, { useState, useEffect } from 'react';
import { generateMindMap } from '../../utils/MindMapUtil';
import MindMapCore from './MindMapCore';
import MindMapModal from './MindMapModal';
import useMermaid from './hooks/useMermaid';

/**
 * MindMap 容器组件
 * 负责状态管理和 API 调用
 */
const MindMapContainer = ({ content, mainPoint }) => {
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const [currentMapSource, setCurrentMapSource] = useState('default');
  const [showModal, setShowModal] = useState(false);
  
  // 使用 Mermaid Hook
  const { isLoaded } = useMermaid();

  // 处理生成思维导图
  useEffect(() => {
    // 如果 Mermaid 还没加载完成，直接返回
    if (!isLoaded) return;
    
    // 重置错误状态
    setError(null);
    
    const generateMap = async () => {
      // 检查是否有内容可生成导图
      if (!content || !mainPoint) {
        console.log("No content or main point, using default mind map");
        if (currentMapSource !== 'default') {
          setCurrentMapSource('default');
          // 使用默认内容
          const defaultContent = await import('./utils/formatter').then(
            module => module.getDefaultMindMapContent()
          );
          setSvgContent(''); // 清除之前的内容
          setTimeout(() => {
            generateMindMapSvg(defaultContent, mainPoint || "Mind Map");
          }, 10);
        }
        return;
      }

      try {
        setIsProcessing(true);
        console.log("Generating mind map for:", mainPoint);
        
        // 使用 MindMapUtil 生成思维导图
        let mapCode = await generateMindMap(content, mainPoint, setIsProcessing);
        
        setCurrentMapSource('generated');
        generateMindMapSvg(mapCode, mainPoint);
      } catch (err) {
        console.error('Failed to generate mind map:', err);
        setError('Unable to generate mind map. Please try again later.');
        
        // 显示简单的错误思维导图
        const fallbackMap = `flowchart TD
          root["${mainPoint || 'Content Overview'}"] --> err["Unable to process"]
          err --> retry["Please try again"]`;
        
        generateMindMapSvg(fallbackMap, mainPoint);
      } finally {
        setIsProcessing(false);
      }
    };

    // 生成思维导图 SVG
    const generateMindMapSvg = async (mapCode, title) => {
      if (!window.mermaid) return;
      
      try {
        const uniqueId = `mindmap-${Date.now()}`;
        const { ensureFlowchartFormat } = await import('./utils/formatter');
        const formattedCode = ensureFlowchartFormat(mapCode, title);
        
        window.mermaid.render(uniqueId, formattedCode)
          .then(({ svg }) => {
            setSvgContent(svg);
          })
          .catch(err => {
            console.error('Mind map rendering error:', err);
            setError('Failed to render mind map');
          });
      } catch (err) {
        console.error('Mind map rendering error:', err);
        setError('Failed to render mind map');
      }
    };

    generateMap();
  }, [content, mainPoint, currentMapSource, isLoaded]);

  // 打开模态框
  const openModal = () => {
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <MindMapCore 
        error={error}
        isProcessing={isProcessing}
        svgContent={svgContent}
        onExpandClick={openModal}
      />
      
      <MindMapModal 
        show={showModal}
        onClose={closeModal}
        svgContent={svgContent}
        isProcessing={isProcessing}
      />
    </>
  );
};

export default MindMapContainer;