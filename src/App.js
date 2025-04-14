import React, { useState, useEffect } from 'react';
import SpeechRecognition from './components/SpeechRecognition';
import OptimizedText from './components/OptimizedText';
import ContentDisplay from './components/ContentDisplay';
import MindMap from './components/MindMap';
import { BackgroundProvider } from './context/BackgroundContext';
import { ApiProvider } from './context/ApiContext';
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
    <ApiProvider>
      <BackgroundProvider>
        <div className="App">
          <div className="header">
            <h1>LazyDog</h1>
          </div>

          <div className="container">
            <div className="speechPanel">
              <SpeechRecognition setOptimizedText={setOptimizedText} />
            </div>
            
            <div className="centerPanel">
              <ContentDisplay />
            </div>
            
            <div className="rightPanel">
              <OptimizedText optimizedText={optimizedText} />
              
              <MindMap 
                content={parsedContent.content} 
                mainPoint={parsedContent.mainPoint}
              />
            </div>
          </div>
        </div>
      </BackgroundProvider>
    </ApiProvider>
  );
}

export default App;