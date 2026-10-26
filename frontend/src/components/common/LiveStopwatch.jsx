import React, { useState, useEffect } from 'react';

/**
 * LiveStopwatch:
 * Decoupled, self-contained timer component that ticks without re-rendering parent components.
 */
function LiveStopwatch({ isRunning, intervalMs = 200, style = null, className = '' }) {
  const [elapsedTime, setElapsedTime] = useState('0.0');

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
      }, intervalMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, intervalMs]);

  return (
    <span style={style} className={className}>
      {elapsedTime}s
    </span>
  );
}

export default React.memo(LiveStopwatch);
