import React, { useState } from 'react';

const PerformanceMonitor = ({ performance }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!performance) return null;

  const getStatusColor = (duration) => {
    if (duration < 1000) return '#28a745'; // Green - Fast
    if (duration < 2000) return '#ffc107'; // Yellow - Acceptable
    return '#dc3545'; // Red - Slow
  };

  const getStatusIcon = (duration) => {
    if (duration < 1000) return '🟢';
    if (duration < 2000) return '🟡';
    return '🔴';
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '300px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          cursor: 'pointer', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>
          {getStatusIcon(performance.total_duration)} Performance Monitor
        </span>
        <span style={{ fontSize: '10px' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>
      
      <div style={{
        color: getStatusColor(performance.total_duration),
        fontWeight: 'bold',
        marginTop: '5px'
      }}>
        Total: {formatDuration(performance.total_duration)}
      </div>

      {isExpanded && (
        <div style={{ marginTop: '10px', lineHeight: '1.4' }}>
          {performance.api_duration && (
            <div>
              API Call: <span style={{ color: getStatusColor(performance.api_duration) }}>
                {formatDuration(performance.api_duration)}
              </span>
            </div>
          )}
          
          {performance.parse_duration && (
            <div>
              Parsing: <span style={{ color: getStatusColor(performance.parse_duration) }}>
                {formatDuration(performance.parse_duration)}
              </span>
            </div>
          )}
          
          {performance.sessions_count !== undefined && (
            <div>Sessions: {performance.sessions_count}</div>
          )}
          
          {performance.lines_processed && (
            <div>Lines Processed: {performance.lines_processed}</div>
          )}
          
          {performance.timeout_reached && (
            <div style={{ color: '#dc3545', fontWeight: 'bold' }}>
              ⚠️ TIMEOUT REACHED
            </div>
          )}
          
          <div style={{ 
            marginTop: '10px', 
            paddingTop: '5px', 
            borderTop: '1px solid #dee2e6',
            fontSize: '10px',
            color: '#6c757d'
          }}>
            Target: &lt;2s | Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;