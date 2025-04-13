import { callAI, formatResponse } from '../services/aiManagement';
import { saveContentToLocalStorage } from './write';

// Add caching functionality to reduce repeated calls
const getMindMapFromCache = (content, mainPoint) => {
  try {
    // Use combination of content and main point as cache key
    const cacheKey = `mindmap_cache_${btoa(content.slice(0, 100) + mainPoint).replace(/=/g, '')}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const cachedData = JSON.parse(cached);
      // Check if cache is within 24 hours
      const cacheTime = new Date(cachedData.timestamp);
      const now = new Date();
      const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        console.log("Using cached mind map data");
        return cachedData.mindMapCode;
      }
    }
    return null;
  } catch (err) {
    console.error('Error accessing cache:', err);
    return null;
  }
};

const saveMindMapToCache = (content, mainPoint, mindMapCode) => {
  try {
    const cacheKey = `mindmap_cache_${btoa(content.slice(0, 100) + mainPoint).replace(/=/g, '')}`;
    const cacheData = {
      mindMapCode,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (err) {
    console.error('Error saving to cache:', err);
  }
};

/**
 * Get historical records and background information from localStorage
 * Used to enhance mind map generation
 * 
 * @returns {Object} Object containing historical records and background information
 */
const getContextualInfo = () => {
  try {
    // Get history records
    const apiResponse = localStorage.getItem('apiResponse');
    let keyPoints = [];
    
    if (apiResponse) {
      const historyRecords = JSON.parse(apiResponse);
      
      // Extract mainPoint from the 5 most recent records as key points
      if (Array.isArray(historyRecords) && historyRecords.length > 0) {
        keyPoints = historyRecords
          .slice(-50) // Last 50 records
          .map(record => record.mainPoint)
          .filter(point => point && point.trim() !== '');
      }
    }
    
    // Get background information
    const backgroundInfo = localStorage.getItem('lastSavedBackground') || '';
    
    return {
      keyPoints,
      backgroundInfo: backgroundInfo.trim()
    };
  } catch (error) {
    console.error('Failed to get contextual information:', error);
    return { keyPoints: [], backgroundInfo: '' };
  }
};

/**
 * Generate mind map data function
 * Convert text content to Mermaid format mind map using AI
 * Integrate key points from history records and background information
 * 
 * @param {string} content - Content text to process
 * @param {string} mainPoint - Main point (used as root node)
 * @param {function} setProcessingState - Function to update processing state
 * @param {string} apiType - API type to use
 * @returns {Promise<string>} - Returns the generated mind map code
 */
export const generateMindMap = async (content, mainPoint, setProcessingState, apiType = 'gemini') => {
  // 设置处理状态
  if (setProcessingState) {
    setProcessingState(true);
  }
  
  // 注意：我们仍然使用content作为缓存键，但不将其包含在提示中
  // 1. 首先检查缓存
  const cachedMindMap = getMindMapFromCache(content, mainPoint);
  if (cachedMindMap) {
    if (setProcessingState) {
      setProcessingState(false);
    }
    return cachedMindMap;
  }
  
  // 获取上下文信息
  const { keyPoints, backgroundInfo } = getContextualInfo();
  
  // 构建提示模板 - 如上所修改
  let promptText = `Please create a Mermaid mind map about this main point.
Main point: "${mainPoint}" (IMPORTANT: Use this exact text as the root node title)`;

  // If background information exists, add to prompt
  if (backgroundInfo) {
    promptText += `\n\nIMPORTANT CONTEXT: "${backgroundInfo}"
Please use the above context information to better understand and organize the mind map content.`;
  }

  // If historical key points exist, add to prompt
  if (keyPoints.length > 0) {
    promptText += `\n\nUser's previously focused key topics: ${keyPoints.map(point => `"${point}"`).join(', ')}
If the main point is related to these topics, you can establish appropriate connections.`;
  }

  // Add output format requirements
  promptText += `\n
The generated mind map should have these characteristics:
1. Use Mermaid syntax
2. Layout direction: Vertical (TD)
3. First line must be "mindmap"
4. CRITICAL: Second line must be the root node using the exact main point provided: "  root((${mainPoint}))"
5. Extract 3-5 key concepts related to the main point, keep it concise
6. Each concept should have at most 1 child node for detail
7. Remove special characters like parentheses () and brackets []
8. Keep node text under 30 characters, be concise and clear
9. Return only the mind map code, without any explanation or Markdown markup

Output example:
mindmap
  root((${mainPoint}))
    Key Concept 1
      Detail 1
    Key Concept 2
    Key Concept 3`;

  // 2. Add retry logic and API rotation
  let retryCount = 0;
  const maxRetries = 3;
  const apiTypes = ['mistral_pixtral', 'gemini', 'glm'];  // API list ordered by priority
  
  // Retry loop
  while (retryCount <= maxRetries) {
    try {
      // Select API based on retry count
      const currentApiType = retryCount === 0 ? apiType : apiTypes[retryCount % apiTypes.length];
      
      console.log(`Calling AI API (${currentApiType}) to generate mind map... (Attempt ${retryCount+1}/${maxRetries+1})`);
      const response = await callAI(promptText, currentApiType);
      
      // Format response
      const formattedResponse = formatResponse(response, currentApiType);
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
      return mindMapCode;
    } catch (error) {
      console.error(`Mind map generation failed (attempt ${retryCount+1}/${maxRetries+1}):`, error);
      
      // If rate limit error (429), retry
      if (error.message.includes('429')) {
        retryCount++;
        
        if (retryCount <= maxRetries) {
          // Calculate exponential backoff delay
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`Rate limited. Retrying in ${delay/1000} seconds with different API...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Other errors, fail directly
        break;
      }
    }
  }
  
  // All attempts failed, return simple error mind map
  console.error('All mind map generation attempts failed');
  
  // 4. Reset processing state
  if (setProcessingState) {
    setProcessingState(false);
  }
  
  return `mindmap
  root((${cleanText(mainPoint || 'Content Overview')}))
    Unable to process
      Please try again later`;
};

/**
 * Save mind map code to local storage
 * 
 * @param {string} mindMapCode - Generated mind map code
 * @param {string} title - Mind map title
 */
const saveMindMapToLocalStorage = (mindMapCode, title) => {
  try {
    // Create storage object
    const mindMapData = {
      title: title || 'Mind Map',
      code: mindMapCode,
      createdAt: new Date().toISOString()
    };
    
    // Save to local storage
    saveContentToLocalStorage(JSON.stringify(mindMapData), 'mindmap_data');
    
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