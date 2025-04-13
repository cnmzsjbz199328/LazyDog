import React, { useState, useEffect } from 'react';
import SpeechRecognition from './components/SpeechRecognition';
import OptimizedText from './components/OptimizedText';
import ContentDisplay from './components/ContentDisplay';
import MindMap from './components/MindMap';
import { BackgroundProvider } from './context/BackgroundContext';
import './App.css';

function App() {
  const [optimizedText, setOptimizedText] = useState(null);
  const [parsedContent, setParsedContent] = useState({
    content: "",
    mainPoint: ""
  });

  // Parse content when optimized text is updated
  useEffect(() => {
    if (optimizedText) {
      try {
        const parsed = JSON.parse(optimizedText);
        setParsedContent(parsed);
      } catch (e) {
        console.error('Error parsing optimized text:', e);
      }
    }
  }, [optimizedText]);

  return (
    <BackgroundProvider>
      <div className="App">
        <div className="header">
          <h1>LazyDog</h1>
        </div>
        
        <div className="container">
          <ContentDisplay />
          
          {/* 添加新的样式包装 */}
          <div className="speechPanel">
            <SpeechRecognition setOptimizedText={setOptimizedText} />
          </div>
          
          <div className="rightPanel">
            <OptimizedText optimizedText={optimizedText} />
            
            {/* Always show MindMap component with either default welcome content or parsed content */}
            <MindMap 
              content={parsedContent.content} 
              mainPoint={parsedContent.mainPoint}
            />
          </div>
        </div>
      </div>
    </BackgroundProvider>
  );
}

export default App;