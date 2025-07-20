import React, { useState, useCallback, useMemo } from 'react';
import { Box, Paper, useTheme, IconButton, Tooltip } from '@mui/material';
import { DragIndicator, Fullscreen, FullscreenExit } from '@mui/icons-material';
import { WidthProvider, Responsive, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface DashboardCardProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultLayout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  isResizable?: boolean;
  isDraggable?: boolean;
  className?: string;
}

export interface DashboardGridProps {
  cards: DashboardCardProps[];
  cols?: { [key: string]: number };
  rowHeight?: number;
  margin?: [number, number];
  containerPadding?: [number, number];
  onLayoutChange?: (layout: Layout[], layouts: { [key: string]: Layout[] }) => void;
  className?: string;
  style?: React.CSSProperties;
}

const DashboardCard: React.FC<DashboardCardProps & { onFullscreen?: (id: string) => void }> = ({
  id,
  title,
  children,
  onFullscreen,
  className = '',
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Paper
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 3,
        background: theme.palette.mode === 'dark'
          ? `
            linear-gradient(145deg, #2d2d2d 0%, #1a1a1a 100%),
            radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.08) 0%, transparent 60%)
          `
          : `
            linear-gradient(145deg, #ffffff 0%, #f8fafc 100%),
            radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 0.04) 0%, transparent 60%)
          `,
        border: theme.palette.mode === 'dark'
          ? '1px solid rgba(251, 191, 36, 0.12)'
          : '1px solid rgba(245, 158, 11, 0.08)',
        // Dramatic 3D shadows
        boxShadow: theme.palette.mode === 'dark'
          ? `
            0 8px 32px rgba(0, 0, 0, 0.7),
            0 4px 16px rgba(251, 191, 36, 0.2),
            inset 0 1px 0 rgba(251, 191, 36, 0.12),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3)
          `
          : `
            0 8px 32px rgba(245, 158, 11, 0.18),
            0 4px 16px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.7),
            inset 0 -1px 0 rgba(245, 158, 11, 0.06)
          `,
        transform: 'translateZ(0)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px) translateZ(5px)',
          boxShadow: theme.palette.mode === 'dark'
            ? `
              0 12px 40px rgba(0, 0, 0, 0.8),
              0 6px 20px rgba(251, 191, 36, 0.25),
              inset 0 1px 0 rgba(251, 191, 36, 0.18),
              inset 0 -1px 0 rgba(0, 0, 0, 0.4)
            `
            : `
              0 12px 40px rgba(245, 158, 11, 0.22),
              0 6px 20px rgba(0, 0, 0, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.8),
              inset 0 -1px 0 rgba(245, 158, 11, 0.08)
            `
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle Header */}
      <Box
        className="drag-handle"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          minHeight: 32,
          cursor: 'move',
          borderBottom: theme.palette.mode === 'dark'
            ? '1px solid rgba(251, 191, 36, 0.1)'
            : '1px solid rgba(245, 158, 11, 0.08)',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.05) 0%, transparent 100%)'
            : 'linear-gradient(90deg, rgba(245, 158, 11, 0.03) 0%, transparent 100%)',
          opacity: isHovered ? 1 : 0.7,
          transition: 'opacity 0.2s ease'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DragIndicator 
            fontSize="small" 
            sx={{ 
              color: theme.palette.mode === 'dark' ? '#fbbf24' : '#f59e0b',
              opacity: 0.7 
            }} 
          />
          {title && (
            <Box
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </Box>
          )}
        </Box>
        
        {onFullscreen && (
          <Tooltip title="Fullscreen">
            <IconButton
              size="small"
              onClick={() => onFullscreen(id)}
              sx={{
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s ease',
                color: theme.palette.mode === 'dark' ? '#fbbf24' : '#f59e0b'
              }}
            >
              <Fullscreen fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Card Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          // Custom scrollbar styling
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.2)' 
              : 'rgba(0, 0, 0, 0.05)',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(251, 191, 36, 0.3)' 
              : 'rgba(245, 158, 11, 0.2)',
            borderRadius: 3,
            '&:hover': {
              background: theme.palette.mode === 'dark' 
                ? 'rgba(251, 191, 36, 0.4)' 
                : 'rgba(245, 158, 11, 0.3)',
            }
          },
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  cards,
  cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  rowHeight = 60,
  margin = [16, 16],
  containerPadding = [16, 16],
  onLayoutChange,
  className = '',
  style = {},
}) => {
  const [fullscreenCard, setFullscreenCard] = useState<string | null>(null);

  // Generate default layouts for all breakpoints
  const defaultLayouts = useMemo(() => {
    const layouts: { [key: string]: Layout[] } = {};
    
    Object.keys(cols).forEach(breakpoint => {
      layouts[breakpoint] = cards.map((card, index) => ({
        i: card.id,
        x: card.defaultLayout?.x ?? (index % (cols[breakpoint] || 12)),
        y: card.defaultLayout?.y ?? Math.floor(index / (cols[breakpoint] || 12)),
        w: card.defaultLayout?.w ?? Math.min(6, cols[breakpoint] || 12),
        h: card.defaultLayout?.h ?? 4,
        minW: card.minW,
        minH: card.minH,
        maxW: card.maxW,
        maxH: card.maxH,
        isResizable: card.isResizable !== false,
        isDraggable: card.isDraggable !== false,
      }));
    });
    
    return layouts;
  }, [cards, cols]);

  const handleFullscreen = useCallback((cardId: string) => {
    setFullscreenCard(fullscreenCard === cardId ? null : cardId);
  }, [fullscreenCard]);

  if (fullscreenCard) {
    const card = cards.find(c => c.id === fullscreenCard);
    if (card) {
      return (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(8px)',
            p: 2,
          }}
        >
          <Box sx={{ height: '100%', position: 'relative' }}>
            <IconButton
              onClick={() => setFullscreenCard(null)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10000,
                color: 'white',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
              }}
            >
              <FullscreenExit />
            </IconButton>
            <DashboardCard {...card} onFullscreen={handleFullscreen}>
              {card.children}
            </DashboardCard>
          </Box>
        </Box>
      );
    }
  }

  return (
    <Box className={className} style={style}>
      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={defaultLayouts}
        cols={cols}
        rowHeight={rowHeight}
        margin={margin}
        containerPadding={containerPadding}
        draggableHandle=".drag-handle"
        onLayoutChange={onLayoutChange}
        isResizable
        isDraggable
        useCSSTransforms
      >
        {cards.map((card) => (
          <div key={card.id}>
            <DashboardCard {...card} onFullscreen={handleFullscreen}>
              {card.children}
            </DashboardCard>
          </div>
        ))}
      </ResponsiveGridLayout>
    </Box>
  );
};

export default DashboardGrid;
