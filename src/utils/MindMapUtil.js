import { callAI, formatResponse } from '../services/aiManagement';
import { storageService } from '../services/storageService'; // 修改导入

/**
 * 从缓存获取思维导图
 * @param {string} content - 内容文本
 * @param {string} mainPoint - 主题要点
 * @returns {string|null} - 缓存的思维导图代码或 null
 */
const getMindMapFromCache = (content, mainPoint) => {
  return storageService.getMindMapCache(content, mainPoint);
};

/**
 * 保存思维导图到缓存
 * @param {string} content - 内容文本
 * @param {string} mainPoint - 主题要点
 * @param {string} mindMapCode - 思维导图代码
 */
const saveMindMapToCache = (content, mainPoint, mindMapCode) => {
  storageService.saveMindMapCache(content, mainPoint, mindMapCode);
};

/**
 * 获取上下文信息
 * @returns {Object} - 包含历史要点和背景信息的对象
 */
const getContextualInfo = () => {
  try {
    console.group('思维导图生成 - 获取上下文信息');
    
    // 从 storageService 获取背景信息
    const backgroundInfo = storageService.getBackgroundInfo();
    console.log(`获取背景信息: "${backgroundInfo}"`);
    
    // 从 storageService 获取历史要点
    const keyPoints = storageService.getHistoryPoints();
    console.log(`获取${keyPoints.length}条历史要点`);
    
    // 打印部分历史要点示例
    if (keyPoints.length > 0) {
      const sampleSize = Math.min(5, keyPoints.length);
      console.log('历史要点样本:');
      keyPoints.slice(-sampleSize).forEach((point, i) => {
        console.log(`  ${i+1}. ${point}`);
      });
    }
    
    console.log(`最终使用${keyPoints.length}条历史要点和背景信息:"${backgroundInfo}"`);
    console.groupEnd();
    
    return {
      keyPoints,
      backgroundInfo: backgroundInfo.trim()
    };
  } catch (error) {
    console.error('获取上下文信息失败:', error);
    console.groupEnd();
    return { 
      keyPoints: [], 
      backgroundInfo: storageService.getBackgroundInfo() || ''
    };
  }
};

/**
 * 生成思维导图数据
 * @param {string} content - 内容文本
 * @param {string} mainPoint - 主题要点
 * @param {function} setProcessingState - 更新处理状态的函数
 * @param {string} externalBackground - 外部传入的背景信息
 * @returns {Promise<string>} - 生成的思维导图代码
 */
export const generateMindMap = async (content, mainPoint, setProcessingState, externalBackground = null) => {
  // 设置处理状态
  if (setProcessingState) {
    setProcessingState(true);
  }
  
  console.group('思维导图生成过程');
  console.log('主题要点:', mainPoint);
  console.log('外部传入背景:', externalBackground);
  
  try {
    // 1. 首先检查缓存
    const cachedMindMap = getMindMapFromCache(content, mainPoint);
    if (cachedMindMap) {
      console.log('使用缓存的思维导图');
      if (setProcessingState) {
        setProcessingState(false);
      }
      console.groupEnd();
      return cachedMindMap;
    }
    
    console.log('没有找到缓存，生成新的思维导图');
    
    // 获取上下文信息
    const { keyPoints, backgroundInfo: localBackground } = getContextualInfo();
    
    // 优先使用外部传入的背景信息
    const backgroundInfo = externalBackground !== null ? externalBackground : localBackground;
    console.log(`使用背景信息: "${backgroundInfo}" (来源: ${externalBackground !== null ? '外部参数' : 'localStorage'})`);
    
    // 详细记录所使用的上下文信息
    console.group('上下文信息汇总');
    console.log(`- 历史要点数量: ${keyPoints.length}`);
    
    // 打印若干历史要点做示例
    if (keyPoints.length > 0) {
      const sampleSize = Math.min(keyPoints.length, 5);
      console.log(`- 历史要点示例 (共${keyPoints.length}条):`);
      keyPoints.slice(-sampleSize).forEach((point, i) => {
        console.log(`  ${i+1}. ${point}`);
      });
    }
    
    console.log(`- 背景信息: ${backgroundInfo ? `"${backgroundInfo}"` : '未设置'}`);
    console.groupEnd();
    
    // 以下逻辑保持不变，但增加更详细的日志
    let promptText = `Please create a Mermaid mind map about this main point.
Main point: "${mainPoint}" (IMPORTANT: Use this exact text as the root node title)`;

    // 如果存在背景信息，添加到提示中
    if (backgroundInfo) {
      console.log(`在提示中包含背景信息: "${backgroundInfo}"`);
      promptText += `\n\nIMPORTANT CONTEXT: "${backgroundInfo}"
Please use the above context information as the domain or subject area to better understand and organize the mind map content.`;
    }

    // 如果存在历史要点，进行智能筛选并添加到提示中
    if (keyPoints.length > 0) {
      // 如果历史要点太多，只选择可能相关的一部分
      let selectedPoints = keyPoints;
      
      // 如果超过15个要点，进行智能筛选
      if (keyPoints.length > 15) {
        console.log('历史要点数量过多，进行智能筛选');
        
        // 筛选策略：保留最新的几条(recency)，以及与当前主题可能相关的几条(relevance)
        const recentPoints = keyPoints.slice(-8); // 最近的8条
        
        // 基于简单关键词匹配查找潜在相关要点
        const mainPointLower = mainPoint.toLowerCase();
        const relatedPoints = keyPoints.filter(point => {
          const pointLower = point.toLowerCase();
          // 查找关键词重叠
          return mainPointLower.split(' ').some(word => 
            word.length > 3 && pointLower.includes(word)
          ) || pointLower.split(' ').some(word => 
            word.length > 3 && mainPointLower.includes(word)
          );
        }).slice(0, 7); // 最多7条相关要点
        
        // 合并并去重
        selectedPoints = [...new Set([...recentPoints, ...relatedPoints])];
        console.log(`筛选后使用 ${selectedPoints.length} 条历史要点`);
      }
      
      promptText += `\n\nUser's historical key topics: ${selectedPoints.map(point => `"${point}"`).join(', ')}
Consider these historical topics when organizing the mind map structure and try to establish connections where relevant.`;
    }

    // 其余部分保持不变
    promptText += `\n
The generated mind map should have these characteristics:
1. Use Mermaid syntax
2. Layout direction: Vertical (TD)
3. First line must be "mindmap"
4. Create a comprehensive root node title that synthesizes:
   - The provided main point: "${mainPoint}"
   - The background information: "${backgroundInfo}"
   - The historical key topics provided above
5. Format the root node as: "Your Synthesized Title"
6. Extract 3-5 key concepts related to the main point, keep it concise
7. Each concept should have at most 1 child node for detail
8. Remove special characters like parentheses () and brackets []
9. Keep node text under 30 characters, be concise and clear
10. Return only the mind map code, without any explanation or Markdown markup

Output example:
mindmap
  Synthesized Title
    Key Concept 1
      Detail 1
    Key Concept 2
    Key Concept 3`;

    // 调用 AI 服务生成思维导图代码 - 现有代码部分保持不变...
    // ...现有代码...
    const response = await callAI(promptText);
    const formattedResponse = formatResponse(response);
    
    let mindMapCode = formattedResponse.text.trim();
    
    // Ensure code begins with mindmap
    if (!mindMapCode.startsWith('mindmap')) {
      const match = mindMapCode.match(/```(?:mermaid)?\s*(mindmap[\s\S]+?)```/);
      if (match) {
        mindMapCode = match[1].trim();
      } else {
        throw new Error("AI response is not a valid mind map format");
      }
    }
    
    // Save generated mind map code to local storage
    saveMindMapToLocalStorage(mindMapCode, mainPoint);
    
    // 3. Add to cache to reduce future calls
    saveMindMapToCache(content, mainPoint, mindMapCode);
    
    console.log("Generated mind map code:", mindMapCode);
    console.groupEnd();
    return mindMapCode;
  } catch (error) {
    console.error('Mind map generation failed:', error);
    console.groupEnd();
    
    // 出错时的兜底处理保持不变...
    if (setProcessingState) {
      setProcessingState(false);
    }
    
    return `mindmap
  root((${cleanText(mainPoint || 'Content Overview')}))
    Unable to process
      Please try again later`;
  }
};

/**
 * 保存思维导图数据到 localStorage
 * @param {string} mindMapCode - 思维导图代码
 * @param {string} title - 思维导图标题
 */
const saveMindMapToLocalStorage = (mindMapCode, title) => {
  try {
    // 创建思维导图数据对象
    const mindMapData = {
      title: title || 'Mind Map',
      code: mindMapCode,
      createdAt: new Date().toISOString()
    };
    
    // 使用 storageService 保存
    storageService.saveMindMapData(mindMapData);
    console.log('Mind map data saved to local storage');
  } catch (err) {
    console.error('Failed to save mind map data:', err);
  }
};

/**
 * Helper function: Clean text, remove special characters
 * 
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
export const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/[()[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Parse mind map code into structured data
 * For possible further analysis or conversion
 * 
 * @param {string} mindMapCode - Mind map code in Mermaid format
 * @returns {Object} - Structured mind map data
 */
export const parseMindMapCode = (mindMapCode) => {
  try {
    // Initialize result object
    const result = {
      root: '',
      nodes: []
    };
    
    if (!mindMapCode) return result;
    
    // Split by line
    const lines = mindMapCode.split('\n');
    
    // Extract root node
    const rootLine = lines.find(line => line.includes('root((') || line.includes('root['));
    if (rootLine) {
      const rootMatch = rootLine.match(/root\(\((.*?)\)\)/) || rootLine.match(/root\[(.*?)\]/);
      result.root = rootMatch ? rootMatch[1] : '';
    }
    
    // Extract other nodes
    lines.forEach(line => {
      const indentation = line.search(/\S/);
      if (indentation >= 0 && !line.includes('mindmap') && !line.includes('root')) {
        const text = line.trim();
        if (text) {
          result.nodes.push({
            level: Math.floor(indentation / 2),
            text: text
          });
        }
      }
    });
    
    return result;
  } catch (err) {
    console.error('Failed to parse mind map code:', err);
    return { root: '', nodes: [] };
  }
};

/**
 * Render mind map function
 * Directly render mind map to specified container using mermaid library
 * 
 * @param {string} code - Mind map code
 * @param {HTMLElement} container - Container element
 * @returns {boolean} - Whether rendering was successful
 */
export const renderMindMap = (code, container) => {
  if (!code || !container || !window.mermaid) return false;

  try {
    // Clear container content
    container.innerHTML = '';
    
    // Create a div with mermaid class
    const mermaidDiv = document.createElement('div');
    mermaidDiv.className = 'mermaid';
    mermaidDiv.textContent = code;
    
    // Add div to container
    container.appendChild(mermaidDiv);
    
    // Call mermaid initialization
    window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    return true;
  } catch (err) {
    console.error('Mind map rendering failed:', err);
    return false;
  }
};