import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Print Mind Map Button Component
 * Standalone component to handle mind map printing functionality
 */
const PrintMindMapButton = ({ containerRef, title, className, style }) => {
  // Handle print functionality
  const handlePrint = useCallback(() => {
    // Check if content is available
    if (!containerRef?.current) {
      console.warn('No mind map container reference available for printing');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Get the SVG element
    const svgElement = containerRef.current.querySelector('svg');
    
    if (!svgElement) {
      console.error('No SVG element found for printing');
      printWindow.close();
      return;
    }
    
    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true);
    
    // Adjust SVG for printing
    clonedSvg.setAttribute('width', '100%');
    clonedSvg.setAttribute('height', 'auto');
    clonedSvg.style.maxWidth = '100%';
    clonedSvg.style.margin = '0 auto';
    clonedSvg.style.display = 'block';
    
    // Create HTML content for the print window
    const documentTitle = title || 'Mind Map';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mind Map - ${documentTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            text-align: center;
          }
          h1 {
            margin-bottom: 20px;
            color: #5c8d89;
          }
          .date {
            font-size: 14px;
            color: #666;
            margin-bottom: 30px;
          }
          @media print {
            @page {
              size: landscape;
              margin: 1cm;
            }
          }
        </style>
      </head>
      <body>
        <h1>${documentTitle}</h1>
        ${clonedSvg.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              // Don't close the window to allow manual printing
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    // Write content to the print window
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }, [containerRef, title]);
  
  return (
    <button 
      className={className}
      onClick={handlePrint}
      title="Print Mind Map"
      aria-label="Print Mind Map"
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid #d1c3a6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginRight: '10px',
        color: '#5c8d89',
        ...style
      }}
    >
      <i className="fas fa-print"></i>
    </button>
  );
};

PrintMindMapButton.propTypes = {
  containerRef: PropTypes.object.isRequired,
  title: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object
};

export default PrintMindMapButton;