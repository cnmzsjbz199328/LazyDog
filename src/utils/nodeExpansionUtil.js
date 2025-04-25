import { callAI, formatResponse } from '../services/aiManagement';
import { storageService } from '../services/storageService'; // 引入 storageService

// 删除未使用的函数
// 不再需要这个函数，因为现在使用 storageService.saveNodeExpansionCache
// const saveNodeExpansionResult = (nodeId, nodeText, childNodes) => {...};

/**
 * Get cached node expansion results
 * @param {string} nodeId - Node ID
 * @returns {Object|null} Cached expansion result or null
 */
const getCachedExpansion = (nodeId) => {
  return storageService.getNodeExpansionCache(nodeId);
};

/**
 * Save node expansion results to cache
 * @param {string} nodeId - Node ID
 * @param {Array} childNodes - Generated child nodes list
 */
const saveExpansionToCache = (nodeId, childNodes) => {
  storageService.saveNodeExpansionCache(nodeId, childNodes);
};

/**
 * Generate child nodes based on node text and context
 * @param {Object} params - Parameter object
 * @param {string} params.nodeText - Current node text
 * @param {string} params.nodeId - Current node ID
 * @param {string} params.originalMindMapCode - Original mind map code
 * @param {string} params.backgroundInfo - Background information
 * @param {Array} params.mainPoints - List of main points
 * @param {Array} params.nodeHierarchy - Node hierarchy structure
 * @param {function} params.onSuccess - Success callback(childNodes)
 * @param {function} params.onError - Error callback(error)
 * @param {function} params.onProcessing - Processing status callback(isProcessing)
 */
export const expandNode = async ({
  nodeText,
  nodeId,
  originalMindMapCode, 
  backgroundInfo,
  mainPoints,
  nodeHierarchy,
  onSuccess,
  onError,
  onProcessing
}) => {
  // Set processing status
  if (onProcessing) {
    onProcessing(true);
  }
  
  // 1. Check cache
  const cachedExpansion = getCachedExpansion(nodeId);
  if (cachedExpansion) {
    console.log(`Using cached expansion result for node ${nodeId}`);
    
    if (onProcessing) onProcessing(false);
    if (onSuccess) onSuccess(cachedExpansion.childNodes);
    
    return cachedExpansion.childNodes;
  }
  
  // 2. Prepare parameters - Handle potential undefined values
  const safeText = nodeText || 'Unknown Node';
  const safeBackground = backgroundInfo || '';
  const safeMainPoints = Array.isArray(mainPoints) ? mainPoints : [];
  const safeHierarchy = Array.isArray(nodeHierarchy) ? nodeHierarchy : [];
  
  try {
    // 3. Build prompt content
    const promptText = buildNodeExpansionPrompt({
      nodeText: safeText,
      originalMindMapCode,
      backgroundInfo: safeBackground,
      mainPoints: safeMainPoints,
      nodeHierarchy: safeHierarchy
    });
    
    // 4. Call AI API
    console.log(`Requesting node expansion: "${safeText}"`);
    const response = await callAI(promptText);
    const formattedResponse = formatResponse(response);
    
    // 5. Parse response
    const childNodes = parseNodeExpansionResponse(formattedResponse.text);
    
    // 6. Save results
    saveExpansionToCache(nodeId, childNodes);
    
    // 7. Return results
    if (onSuccess) onSuccess(childNodes);
    console.log(`Node "${safeText}" expansion successful, generated ${childNodes.length} child nodes`);
    
    return childNodes;
  } catch (error) {
    console.error(`Failed to expand node: "${safeText}"`, error);
    
    if (onError) onError(error);
    
    // Return empty array to indicate failure
    return [];
  } finally {
    // Set processing complete status
    if (onProcessing) {
      onProcessing(false);
    }
  }
};

/**
 * Build AI prompt for node expansion
 * @param {Object} params - Parameters needed to build the prompt
 * @returns {string} Constructed prompt text
 * @private
 */
function buildNodeExpansionPrompt({ 
  nodeText, 
  originalMindMapCode,
  backgroundInfo,
  mainPoints,
  nodeHierarchy
}) {
  // Build context section
  let contextParts = [];
  
  // Add background information
  if (backgroundInfo && backgroundInfo.trim()) {
    contextParts.push(`Background information:\n${backgroundInfo}`);
  }
  
  // Add main points
  if (mainPoints && mainPoints.length > 0) {
    const mainPointsText = mainPoints.map((point, index) => `${index+1}. ${point}`).join('\n');
    contextParts.push(`Main points:\n${mainPointsText}`);
  }
  
  // Add node hierarchy
  if (nodeHierarchy && nodeHierarchy.length > 0) {
    const hierarchyPath = nodeHierarchy
      .map(node => node.text)
      .join(' → ');
    
    contextParts.push(`Current node hierarchy path: ${hierarchyPath}`);
  }
  
  // Add current mind map structure
  if (originalMindMapCode && originalMindMapCode.trim()) {
    const codePreview = originalMindMapCode.length > 1000 
      ? originalMindMapCode.slice(0, 1000) + '...' 
      : originalMindMapCode;
    
    contextParts.push(`Current mind map structure:\n${codePreview}`);
  }
  
  // Merge context information
  const contextSection = contextParts.length > 0
    ? `Here is relevant background and context information:\n\n${contextParts.join('\n\n')}`
    : '';
  
  // Build final prompt
  return `Please generate 3-5 related child nodes for the mind map node "${nodeText}".
${contextSection}

Based on the node content and context information, return a list of child nodes directly related to "${nodeText}".
Response format requirements:
1. Return only a JSON array, without any additional explanations
2. Each object should only contain a "text" field representing the node title
3. Node titles should be concise, clear, and not exceed 30 characters
4. JSON format must be correct with no syntax errors
5. Do not use Markdown formatting

Here's an example of the expected response format:
[
  {"text": "Child Node A"},
  {"text": "Child Node B"},
  {"text": "Child Node C"},
  {"text": "Child Node D"}
]`;
}

/**
 * Parse AI response for node expansion
 * @param {string} responseText - AI response text
 * @returns {Array} Parsed child nodes array
 * @private
 */
function parseNodeExpansionResponse(responseText) {
  try {
    // Try to find and extract the JSON part
    const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
    const jsonText = jsonMatch ? jsonMatch[0] : responseText;
    
    // Clean the text
    const cleanedText = jsonText
      .replace(/```(?:json)?|```/g, '')  // Remove possible code block markers
      .trim();
    
    // Parse JSON
    const parsedNodes = JSON.parse(cleanedText);
    
    // Validate data structure
    if (!Array.isArray(parsedNodes)) {
      throw new Error('Response is not a valid array');
    }
    
    // Validate each node and standardize
    return parsedNodes.map((node, index) => {
      // Ensure each node has at least a text property
      if (!node || typeof node !== 'object' || !node.text) {
        return { 
          text: `Child Node ${index + 1}`
        };
      }
      
      // Standardize node - only return text field
      return {
        text: node.text.trim()
      };
    });
  } catch (error) {
    console.error('Failed to parse node expansion response:', error);
    
    // Return simple error nodes
    return [
      { text: 'Parse Failed' },
      { text: 'Please Try Again' }
    ];
  }
}

/**
 * Merge generated child nodes into the original mind map code
 * Strategy: Remove all branch nodes under the original node, then replace with new nodes
 * @param {string} originalMindMapCode - Original mind map code
 * @param {string} nodeText - Text of the node to expand
 * @param {Array} childNodes - Generated child nodes list
 * @returns {string} Updated mind map code
 */
export const mergeNodeExpansionToMindMap = (originalMindMapCode, nodeText, childNodes) => {
  try {
    if (!originalMindMapCode || !nodeText || !Array.isArray(childNodes) || childNodes.length === 0) {
      return originalMindMapCode;
    }
    
    // Split into lines
    const lines = originalMindMapCode.split('\n');
    
    // Find target node line and its indentation
    let targetIndex = -1;
    let targetIndent = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim().replace(/\(\(|\)\)|"|'/g, '');
      
      if (trimmedLine === nodeText || trimmedLine.includes(nodeText)) {
        targetIndex = i;
        targetIndent = line.search(/\S|$/);
        break;
      }
    }
    
    if (targetIndex === -1) {
      console.warn(`Node not found in mind map: "${nodeText}"`);
      return originalMindMapCode;
    }
    
    // Calculate child node indentation (two more spaces)
    const childIndent = ' '.repeat(targetIndent + 2);
    
    // Create new child node lines
    const childLines = childNodes.map(node => 
      `${childIndent}${node.text}`
    );
    
    // Find all current child nodes to remove them
    let linesToRemove = [];
    
    // Start from the line after the target node
    for (let i = targetIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        // Skip empty lines
        continue;
      }
      
      const currentIndent = line.search(/\S|$/);
      
      // If indentation is equal to or less than current node's, it's no longer a child
      if (currentIndent <= targetIndent) {
        break;
      }
      
      // Otherwise, mark this line for removal
      linesToRemove.push(i);
    }
    
    // Remove all child node lines
    if (linesToRemove.length > 0) {
      console.log(`Removed ${linesToRemove.length} old child nodes under "${nodeText}"`);
      
      // Calculate how many lines to delete
      const deleteCount = linesToRemove[linesToRemove.length - 1] - linesToRemove[0] + 1;
      
      // Delete from the first child node line
      lines.splice(linesToRemove[0], deleteCount);
      
      // Adjust insertion position, because we just deleted lines
      targetIndex = linesToRemove[0] - 1;
    }
    
    // Insert new child nodes
    lines.splice(targetIndex + 1, 0, ...childLines);
    console.log(`Added ${childLines.length} new child nodes to node "${nodeText}"`);
    
    // Merge and return
    return lines.join('\n');
  } catch (error) {
    console.error('Failed to merge expanded nodes into mind map:', error);
    return originalMindMapCode;
  }
};