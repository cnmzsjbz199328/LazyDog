import React, { useState, useEffect, useCallback } from 'react';
import { generateMindMap } from '../../utils/MindMapUtil';
import MindMapCore from './MindMapCore';
import MindMapModal from './MindMapModal';
import useMermaid from './hooks/useMermaid';

/**
 * MindMap 容器组件
 * 负责状态管理和 API 调用
 */
const MindMapContainer = ({ content, mainPoint, ...props }) => {
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const [currentMapSource, setCurrentMapSource] = useState('default');
  const [showModal, setShowModal] = useState(false);
  
  // 使用 Mermaid Hook
  const { isLoaded } = useMermaid();

  // 将 generateMindMapSvg 提取到 useEffect 外部，使其可以被其他函数引用
  const generateMindMapSvg = useCallback(async (mapCode, title) => {
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
  }, []);

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
        console.group("MindMapContainer: 生成思维导图");
        console.log("主题:", mainPoint);
        
        // 使用 MindMapUtil 生成思维导图，不需要传递额外的上下文对象
        // MindMapUtil会直接从localStorage获取最新数据
        let mapCode = await generateMindMap(content, mainPoint, setIsProcessing);
        
        setCurrentMapSource('generated');
        generateMindMapSvg(mapCode, mainPoint);
        console.groupEnd();
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

    generateMap();
  }, [content, mainPoint, currentMapSource, isLoaded, generateMindMapSvg]);

  // 添加思维导图更新处理
  const handleMindMapUpdate = useCallback(() => {
    // 当思维导图被更新时，重新获取并渲染
    const mindMapData = localStorage.getItem('mindmap_data');
    if (mindMapData) {
      try {
        const parsedData = JSON.parse(mindMapData);
        if (parsedData && parsedData.code) {
          console.log('主视图更新思维导图');
          
          // 确保 generateMindMapSvg 返回 Promise
          generateMindMapSvg(parsedData.code, parsedData.title || 'Mind Map')
            .then(() => {
              console.log('主视图思维导图更新完成');
            })
            .catch(err => {
              console.error('主视图更新失败:', err);
            });
        }
      } catch (err) {
        console.error('解析更新后的思维导图数据失败:', err);
      }
    }
  }, [generateMindMapSvg]);

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
        onMindMapUpdate={handleMindMapUpdate}
      />
    </>
  );
};

export default MindMapContainer;