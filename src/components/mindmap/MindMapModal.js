import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '../Modal';
import MindMapDisplay from './components/MindMapDisplay';
import PrintMindMapButton from './components/PrintMindMapButton';
import { useMindMapInteraction } from './hooks/useMindMapInteraction';
import styles from '../css/MindMap.module.css';

/**
 * Mind Map Modal Component
 */
const MindMapModal = ({ show, onClose, svgContent, isProcessing, onMindMapUpdate }) => {
  const [shouldReload, setShouldReload] = useState(false);
  const [mermaidCode, setMermaidCode] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  
  // Use ref to track already expanded nodes, to avoid repeated expansion
  const expandedNodesRef = useRef(new Set());
  // Track the timestamp of the last expansion operation, preventing multiple expansions in short time
  const lastExpandTimeRef = useRef(0);
  // Track the currently processing node ID
  const processingNodeRef = useRef(null);
  // Ref for the mind map container to access SVG for printing
  const mindMapContainerRef = useRef(null);
  
  // Add logging: Component state change tracking
  useEffect(() => {
  }, [shouldReload, mermaidCode, isRendering, isProcessing, show, svgContent]);
  
  // Use the mind map interaction hook, including expansion functionality
  const {
    lastClickedNode,
    expandCurrentNode,
    isExpanding,
    expandError,
    mindMapUpdated,
    resetMindMapUpdated
  } = useMindMapInteraction();
  
  // Monitor mindMapUpdated state changes
  useEffect(() => {
  }, [mindMapUpdated]);
  
  // Extract function to get the latest mind map data
  const fetchLatestMindMapData = useCallback(() => {
    try {
      const mindMapData = localStorage.getItem('mindmap_data');
      
      if (mindMapData) {
        const parsedData = JSON.parse(mindMapData);
        if (parsedData && parsedData.code) {
          
          // Set code and force render phase
          setMermaidCode(parsedData.code);
          setIsRendering(true); // Immediately trigger rendering phase
          
          // Add short delay to reset shouldReload, ensuring component has enough time to render
          setTimeout(() => {
            setShouldReload(false);
          }, 100);
        } else {
          setShouldReload(false);
        }
      } else {
        setShouldReload(false);
      }
    } catch (error) {
      setShouldReload(false);
    }
  }, []);
  
  // Listen for mind map updates
  useEffect(() => {
    // If no update, return directly
    if (!mindMapUpdated) return;
    
    // Set reload flag
    setShouldReload(true);
    
    // Notify parent component
    if (onMindMapUpdate) {
      onMindMapUpdate();
    }
    
    // Reset update flag
    resetMindMapUpdated();
    
    // Delay fetching latest data
    const timer = setTimeout(() => {
      fetchLatestMindMapData();
      
      // Release processing node reference after completion
      processingNodeRef.current = null;
    }, 500);
    
    // Add safety timeout to prevent permanent loading
    const safetyTimer = setTimeout(() => {
      if (shouldReload) {
        setShouldReload(false);
        processingNodeRef.current = null;
      }
    }, 5000); // Force reset after 5 seconds
    
    // Add extra safety check
    const extraSafetyTimer = setTimeout(() => {
      
      if (shouldReload || isRendering) {
        setShouldReload(false);
        setIsRendering(false);
        setMermaidCode(null);
        processingNodeRef.current = null;
      }
    }, 10000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
      clearTimeout(extraSafetyTimer);
    };
  }, [mindMapUpdated, onMindMapUpdate, resetMindMapUpdated, shouldReload, fetchLatestMindMapData, mermaidCode, isRendering]);
  
  // Render start callback
  const handleRenderStart = useCallback(() => {
    setIsRendering(true);
  }, []);
  
  // Modified render complete callback
  const handleRenderComplete = useCallback((renderedSvg, error) => {
    
    // Reset loading state regardless of success or failure
    setIsRendering(false);
    setShouldReload(false);
    
    // Only clear mermaidCode on success
    if (!error && renderedSvg) {
      setMermaidCode(null);
    } else if (error) {
    }
    
    // Release processing node reference after rendering completes
    processingNodeRef.current = null;
  }, []);
  
  // Handle node expansion
  const handleExpandNode = useCallback(async () => {
    if (!lastClickedNode) {
      return;
    }
    
    const nodeId = lastClickedNode.id;
    
    // Check if this node is already being processed
    if (processingNodeRef.current === nodeId) {
      return;
    }
    
    // Check if the node has already been expanded
    if (expandedNodesRef.current.has(nodeId)) {
      return;
    }
    
    // Check time interval to avoid multiple expansions in short time
    const now = Date.now();
    if (now - lastExpandTimeRef.current < 1500) { // At least 1.5 seconds interval
      return;
    }
    
    // Set current processing node
    processingNodeRef.current = nodeId;
    // Update last expansion time
    lastExpandTimeRef.current = now;
    
    try {
      await expandCurrentNode();
      
      // Mark node as expanded
      expandedNodesRef.current.add(nodeId);
      
      // Get the latest data and trigger rendering after successful expansion
      setShouldReload(true);
      
      // Short delay before fetching data
      setTimeout(() => {
        fetchLatestMindMapData();
      }, 500);
      
    } catch (error) {
      // Reset processing state after failure
      processingNodeRef.current = null;
    }
  }, [lastClickedNode, expandCurrentNode, fetchLatestMindMapData]);
  
  // Listen for lastClickedNode changes, automatically trigger expansion (optimized version)
  useEffect(() => {
    // Ensure there is a clicked node and no ongoing operation
    if (lastClickedNode && 
        !isExpanding && 
        !shouldReload && 
        !isRendering && 
        !isProcessing &&
        processingNodeRef.current === null) {
      
      const nodeId = lastClickedNode.id;
      
      // If the node has been expanded, don't trigger expansion again
      if (expandedNodesRef.current.has(nodeId)) {
        return;
      }
      
      // Add 300ms delay to avoid repeated rendering due to rapid clicks
      const timer = setTimeout(() => {
        handleExpandNode();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [lastClickedNode, isExpanding, shouldReload, isRendering, isProcessing, handleExpandNode]);

  // Reset expanded nodes set when component is shown
  useEffect(() => {
    if (show) {
      expandedNodesRef.current = new Set();
    }
  }, [show]);

  // Determine whether to show loading state
  const showLoading = isProcessing || shouldReload || isRendering || isExpanding;
  
  // Determine whether content is available for rendering
  const hasContent = mermaidCode || svgContent;
  
  // Add display status logging
  useEffect(() => {
    if (show) {
    }
  }, [show, showLoading, hasContent, isProcessing, shouldReload, isRendering, isExpanding]);

  return (
    <Modal
      show={show}
      onClose={() => {
        onClose();
      }}
      title="MindMap"
      extraButtons={
        <PrintMindMapButton 
          containerRef={mindMapContainerRef}
          title={lastClickedNode?.text || "Mind Map"}
          className={styles.printButton}
        />
      }
    >
      <div className={styles.modalMindMapContent}>
        {/* Show loading state, but don't block rendering */}
        {showLoading && (
          <div className={styles.processingIndicator} style={{position: 'absolute', top: 0, left: 0, width: '100%', padding: '10px', zIndex: 100, backgroundColor: 'rgba(255,255,255,0.7)'}}>
            <i className="fas fa-spinner fa-spin"></i>
            {isExpanding ? "Expanding node..." : 
             (shouldReload ? "Reloading mind map..." : 
             (isRendering ? "Rendering mind map..." : "Generating mind map..."))}
          </div>
        )}
        
        {/* Render content if available, regardless of loading state */}
        {(mermaidCode || svgContent) ? (
          <div 
            ref={mindMapContainerRef}
            style={{position: 'relative', width: '100%', height: '100%'}}
          >
            <MindMapDisplay 
              key={mermaidCode ? `mc-${Date.now()}` : 'svg'} // Add key to force re-render
              mermaidCode={mermaidCode}
              svgContent={!mermaidCode ? svgContent : null}
              isModal={true}
              isInteractive={true}
              onRenderStart={handleRenderStart}
              onRenderComplete={handleRenderComplete}
            />
          </div>
        ) : (
          <div className={styles.placeholder}>
            No mind map content available
          </div>
        )}
      </div>
      
      {/* Retain error message display */}
      {expandError && (
        <div className={styles.expandError} style={{ margin: '10px 0', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', color: '#d32f2f' }}>
          <i className="fas fa-exclamation-triangle"></i> {expandError}
        </div>
      )}
    </Modal>
  );
};

export default MindMapModal;