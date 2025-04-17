import React, { useRef, useEffect, useState, useCallback } from 'react';
import Modal from '../Modal';
import styles from '../css/MindMap.module.css';
import { renderMermaidDiagram } from './utils/mermaidHelper';

/**
 * 思维导图模态框组件
 */
const MindMapModal = ({ show, onClose, svgContent, isProcessing }) => {
  const modalContentRef = useRef(null);
  const [lastClickedNode, setLastClickedNode] = useState(null);
  const [relatedRecords, setRelatedRecords] = useState([]);

  // 控制模态框打开时阻止页面滚动
  useEffect(() => {
    if (show) {
      // 当模态框打开时，阻止背景页面滚动
      document.body.style.overflow = 'hidden';
    } else {
      // 当模态框关闭时，恢复页面滚动
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      // 组件卸载时恢复滚动
      document.body.style.overflow = 'auto';
    };
  }, [show]);

  // 获取相关记录的函数
  const fetchRelatedRecords = useCallback((nodeText) => {
    try {
      const apiResponse = localStorage.getItem('apiResponse');
      if (apiResponse) {
        const records = JSON.parse(apiResponse);
        console.log(`Searching for records related to "${nodeText}"`);
        
        if (Array.isArray(records)) {
          // 使用更广泛的匹配条件来查找相关记录
          const related = records.filter(record => 
            record && 
            ((record.content && record.content.toLowerCase().includes(nodeText.toLowerCase())) || 
             (record.mainPoint && record.mainPoint.toLowerCase().includes(nodeText.toLowerCase())))
          );
          
          console.log(`Found ${related.length} related records`);
          setRelatedRecords(related);
        }
      } else {
        console.log('No records found in localStorage');
        setRelatedRecords([]);
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      setRelatedRecords([]);
    }
  }, []);

  // 处理节点点击的函数
  // 修改handleNodeClick函数以添加更多日志
  const handleNodeClick = useCallback((event) => {
    console.log('接收到mindmap-node-click事件:', event);
    console.log('事件详情:', event.detail);
    
    if (event.detail && event.detail.nodeId && event.detail.nodeText) {
      const nodeId = event.detail.nodeId;
      const nodeText = event.detail.nodeText;
      
      console.log(`模态框接收到节点点击: ${nodeId} - "${nodeText}"`);
      
      // 设置最后点击的节点
      setLastClickedNode({
        id: nodeId,
        text: nodeText
      });
      console.log('已设置lastClickedNode状态');
      
      // 查询localStorage中的摘要数据
      console.log(`开始搜索与"${nodeText}"相关的记录`);
      fetchRelatedRecords(nodeText);
    } else {
      console.warn('收到的事件缺少必要的detail属性:', event);
    }
  }, [fetchRelatedRecords]);
  
  // 修改useEffect，添加额外日志
  useEffect(() => {
    console.log('添加mindmap-node-click全局事件监听器');
    window.addEventListener('mindmap-node-click', handleNodeClick);
    
    // 清理函数
    return () => {
      console.log('移除mindmap-node-click全局事件监听器');
      window.removeEventListener('mindmap-node-click', handleNodeClick);
    };
  }, [handleNodeClick]);
  
  // 在模态框显示时渲染交互式 SVG，添加更多日志
  useEffect(() => {
    console.log('模态框状态变化:', { show, hasContent: !!svgContent, hasRef: !!modalContentRef.current });
    
    if (show && modalContentRef.current && svgContent) {
      console.log('模态框显示，准备渲染交互式SVG');
      
      // 延迟一小段时间以确保 DOM 稳定
      const timer = setTimeout(async () => {
        try {
          // 提取 SVG 代码中的 mermaid 内容
          console.log('从SVG中提取Mermaid代码');
          const mermaidCode = extractMermaidCode(svgContent);
          console.log('提取的Mermaid代码:', mermaidCode ? '成功' : '失败');
          
          if (mermaidCode) {
            console.log('使用Mermaid代码渲染交互式思维导图');
            await renderMermaidDiagram(
              mermaidCode,
              modalContentRef.current,
              true, // 是模态框
              true  // 启用交互
            );
            console.log('交互式思维导图渲染完成');
          } else {
            // 回退到非交互式模式
            console.log('无法提取Mermaid代码，使用非交互式模式并手动添加事件监听器');
            modalContentRef.current.innerHTML = svgContent;
            
            // 即使在非交互式模式下，也尝试添加交互功能
            setTimeout(async () => {
              const svgElement = modalContentRef.current.querySelector('svg');
              if (svgElement) {
                console.log('在非交互式模式下找到SVG元素，尝试添加节点交互');
                
                try {
                  const { adjustSvgElement, addNodeInteractivity } = await import('./utils/svgHelper');
                  
                  // 调整SVG样式
                  adjustSvgElement(svgElement, true);
                  
                  // 查找原始SVG中的真实节点
                  const textElements = svgElement.querySelectorAll('text');
                  console.log(`在原始SVG中找到${textElements.length}个文本节点`);
                  
                  // 打印一些文本节点的内容以便调试
                  if (textElements.length > 0) {
                    const sampleTexts = Array.from(textElements).slice(0, 5).map(el => el.textContent);
                    console.log('文本节点示例:', sampleTexts);
                  }
                  
                  // 添加交互性
                  addNodeInteractivity(svgElement);
                  
                  console.log('已成功为原始SVG添加交互性');
                } catch (err) {
                  console.error('为SVG添加交互性时出错:', err);
                }
              }
            }, 150); // 稍微延长时间，确保DOM完全渲染
          }
        } catch (error) {
          console.error('渲染交互式思维导图时出错:', error);
          // 回退到非交互式模式
          modalContentRef.current.innerHTML = svgContent;
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [show, svgContent]);

  // 添加事件监听器，确保在组件挂载和卸载时正确处理
  useEffect(() => {
    // 监听全局事件
    window.addEventListener('mindmap-node-click', handleNodeClick);
    
    // 清理函数
    return () => {
      window.removeEventListener('mindmap-node-click', handleNodeClick);
    };
  }, [handleNodeClick]);
  
  // 在模态框显示时渲染交互式 SVG
  useEffect(() => {
    if (show && modalContentRef.current && svgContent) {
      // 延迟一小段时间以确保 DOM 稳定
      const timer = setTimeout(async () => {
        try {
          // 提取 SVG 代码中的 mermaid 内容
          const mermaidCode = extractMermaidCode(svgContent);
          
          if (mermaidCode) {
            await renderMermaidDiagram(
              mermaidCode,
              modalContentRef.current,
              true, // 是模态框
              true  // 启用交互
            );
            console.log('Interactive mind map rendered in modal');
            
            // 确保事件绑定在SVG渲染完成后重新生效
            const svgElement = modalContentRef.current.querySelector('svg');
            if (svgElement) {
              console.log('Re-attaching event listeners to nodes');
              // 确认是否有节点
              const nodes = svgElement.querySelectorAll('.node');
              console.log(`Found ${nodes.length} nodes in SVG`);
            }
          } else {
            // 回退到非交互式模式
            modalContentRef.current.innerHTML = svgContent;
            console.log('Could not extract mermaid code, using non-interactive mode');
          }
        } catch (error) {
          console.error('Error rendering interactive mind map:', error);
          // 回退到非交互式模式
          modalContentRef.current.innerHTML = svgContent;
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [show, svgContent]);

  // 从SVG内容提取Mermaid代码
  const extractMermaidCode = (svgContent) => {
    try {
      console.log('开始分析SVG内容以提取Mermaid代码');
      
      // 检查SVG内容
      if (!svgContent) {
        console.error('SVG内容为空');
        return null;
      }
      
      console.log('SVG内容长度:', svgContent.length);
      
      // 更多灵活的模式匹配方法
      // 1. 尝试从HTML注释中提取
      const commentPatterns = [
        /<!--\s*(graph\s+TD[\s\S]*?)-->/i,
        /<!--\s*(flowchart\s+TD[\s\S]*?)-->/i,
        /<!--\s*(mindmap[\s\S]*?)-->/i
      ];
      
      for (const pattern of commentPatterns) {
        const match = svgContent.match(pattern);
        if (match && match[1]) {
          console.log('在HTML注释中找到Mermaid代码');
          return match[1].trim();
        }
      }
      
      // 2. 尝试从data属性中提取
      const dataMatch = svgContent.match(/data-mermaid="([^"]+)"/);
      if (dataMatch && dataMatch[1]) {
        console.log('在data-mermaid属性中找到Mermaid代码');
        return decodeURIComponent(dataMatch[1]);
      }
      
      // 3. 尝试从特定div中提取(可能是mermaid库的隐藏输出)
      const divMatch = svgContent.match(/<div class="mermaid"[^>]*>([\s\S]*?)<\/div>/i);
      if (divMatch && divMatch[1]) {
        console.log('在div.mermaid中找到Mermaid代码');
        return divMatch[1].trim();
      }
      
      // 4. 因为我们无法准确提取原始节点内容，还是直接使用原始SVG更好
      console.log('不再尝试推断Mermaid代码，直接使用原始SVG');
      return null;
    } catch (e) {
      console.error('提取Mermaid代码时出错:', e);
      return null;
    }
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Mind Map"
    >
      <div 
        ref={modalContentRef}
        className={styles.modalMindMapContent}
      >
        {isProcessing ? (
          <div className={styles.processingIndicator}>
            <i className="fas fa-spinner fa-spin"></i> Generating mind map...
          </div>
        ) : !svgContent && (
          <div className={styles.placeholder}>
            No mind map content available
          </div>
        )}
      </div>
      
      {lastClickedNode && (
        <div className={styles.nodeInfoPanel}>
          <h4>Selected Node: {lastClickedNode.text}</h4>
          {relatedRecords.length > 0 ? (
            <div className={styles.relatedRecords}>
              <h5>Related Records ({relatedRecords.length}):</h5>
              <div className={styles.recordsList}>
                {relatedRecords.map((record, index) => (
                  <div key={index} className={styles.recordItem}>
                    <div className={styles.recordMainPoint}>{record.mainPoint}</div>
                    <div className={styles.recordContent}>{record.content}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className={styles.noRecords}>
              No directly related records found for this topic.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default MindMapModal;