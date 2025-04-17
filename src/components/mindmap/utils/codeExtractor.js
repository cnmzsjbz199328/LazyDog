/**
 * 从SVG内容提取Mermaid代码
 */
export const extractMermaidCode = (svgContent) => {
  try {
    if (!svgContent) return null;
    
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
    
    // 3. 尝试从特定div中提取
    const divMatch = svgContent.match(/<div class="mermaid"[^>]*>([\s\S]*?)<\/div>/i);
    if (divMatch && divMatch[1]) {
      console.log('在div.mermaid中找到Mermaid代码');
      return divMatch[1].trim();
    }
    
    return null;
  } catch (e) {
    console.error('提取Mermaid代码时出错:', e);
    return null;
  }
};