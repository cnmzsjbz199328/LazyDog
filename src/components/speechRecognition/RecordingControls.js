import React from 'react';
import styles from '../css/RecordingControls.module.css';

const RecordingControls = ({ isListening, startRecognition, stopRecognition }) => {
  return (
    <>
      <div className={styles.btnGroup}>
        <button
          onClick={startRecognition}
          disabled={isListening}
          className={`${styles.button} ${styles.startButton} ${isListening ? styles.buttonDisabled : ''}`}
        >
          <i className="fas fa-microphone"></i> Start Recording
        </button>
        <button
          onClick={stopRecognition}
          disabled={!isListening}
          className={`${styles.button} ${styles.stopButton} ${!isListening ? styles.buttonDisabled : ''}`}
        >
          <i className="fas fa-stop"></i> Stop Recording
        </button>
      </div>
      
      {isListening && (
        <div className={styles.recordingStatus}>
          <span className={styles.pulse}></span> Recording...
        </div>
      )}
    </>
  );
};

export default RecordingControls;