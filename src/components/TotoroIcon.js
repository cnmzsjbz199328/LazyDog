import React from 'react';

const TotoroIcon = ({ className }) => (
  <svg 
    className={className} 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    width="80" 
    height="80"
  >
    <path 
      d="M50 10c-22.1 0-40 17.9-40 40s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40zm0 75c-19.3 0-35-15.7-35-35s15.7-35 35-35 35 15.7 35 35-15.7 35-35 35z"
      fill="#5c8d89"
      opacity="0.2"
    />
    <circle cx="35" cy="45" r="5" fill="#5c8d89" opacity="0.2" />
    <circle cx="65" cy="45" r="5" fill="#5c8d89" opacity="0.2" />
    <path 
      d="M50 65c-8.3 0-15-2.2-15-5s6.7-5 15-5 15 2.2 15 5-6.7 5-15 5z" 
      fill="#5c8d89" 
      opacity="0.2"
    />
    <path 
      d="M30 30l-10-10M70 30l10-10" 
      stroke="#5c8d89" 
      strokeWidth="2"
      opacity="0.2"
    />
  </svg>
);

export default TotoroIcon;