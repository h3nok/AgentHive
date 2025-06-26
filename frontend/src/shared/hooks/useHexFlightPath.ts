import { useMemo } from 'react';

interface FlightPath {
  x: number[];
  y: number[];
}

interface ViewportDimensions {
  width: number;
  height: number;
}

/**
 * Custom hook that generates hexagonal flight path keyframes based on viewport size
 * Returns x and y coordinate arrays for smooth hexagonal motion
 */
export const useHexFlightPath = (
  beeSize: number = 40,
  viewport: ViewportDimensions = { width: 1200, height: 800 }
): FlightPath => {
  return useMemo(() => {
    const { width, height } = viewport;
    
    // Calculate safe margins to keep bee visible
    const margin = beeSize + 20;
    const safeWidth = width - (margin * 2);
    const safeHeight = height - (margin * 2);
    
    // Center point for hexagon
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Hexagon radius (smaller of width/height to fit in viewport)
    const radius = Math.min(safeWidth, safeHeight) * 0.25;
    
    // Generate hexagon vertices (6 points + return to start)
    const hexPoints: { x: number; y: number }[] = [];
    
    for (let i = 0; i <= 6; i++) {
      const angle = (i * Math.PI) / 3; // 60 degrees in radians
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      // Ensure points stay within safe boundaries
      const clampedX = Math.max(margin, Math.min(width - margin, x));
      const clampedY = Math.max(margin, Math.min(height - margin, y));
      
      hexPoints.push({ x: clampedX, y: clampedY });
    }
    
    // Add smooth intermediate points between hex vertices for Bézier-like curves
    const smoothPath: { x: number; y: number }[] = [];
    
    for (let i = 0; i < hexPoints.length - 1; i++) {
      const current = hexPoints[i];
      const next = hexPoints[i + 1];
      
      // Add current point
      smoothPath.push(current);
      
      // Add curved transition points
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      
      // Add slight curve offset for smooth motion
      const curveOffset = 15;
      const perpX = -(next.y - current.y) / Math.sqrt((next.x - current.x) ** 2 + (next.y - current.y) ** 2) * curveOffset;
      const perpY = (next.x - current.x) / Math.sqrt((next.x - current.x) ** 2 + (next.y - current.y) ** 2) * curveOffset;
      
      smoothPath.push({
        x: midX + (isNaN(perpX) ? 0 : perpX),
        y: midY + (isNaN(perpY) ? 0 : perpY),
      });
    }
    
    // Extract x and y coordinates
    const x = smoothPath.map(point => point.x);
    const y = smoothPath.map(point => point.y);
    
    return { x, y };
  }, [beeSize, viewport.width, viewport.height]);
};

/**
 * Hook for responsive viewport dimensions
 */
export const useViewportDimensions = (): ViewportDimensions => {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return { width: 1200, height: 800 };
    }
    
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }, []);
};
