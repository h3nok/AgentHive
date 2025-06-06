import React, { useRef } from 'react';
import { Box, Drawer, IconButton, Typography, useMediaQuery, useTheme, Tabs, Tab } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import { useCanvas } from '../context/CanvasContext';
import MarkdownRenderer from './markdown/MarkdownRenderer';
import ChartFactory, { ChartConfig } from './ChartFactory';

const CanvasPanel: React.FC = () => {
  const { isOpen, activeMessage, close, width, setWidth } = useCanvas();
  const [tab, setTab] = React.useState(0);

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (_event: React.SyntheticEvent, newVal: number) => setTab(newVal);

  // Reset tab to Document when a new message becomes active
  React.useEffect(() => {
    if (!activeMessage) return;
    if (activeMessage.text.startsWith('#chart:')) {
      setTab(2); // Visualization
    } else {
      setTab(0);
    }
  }, [activeMessage?.id]);

  // Simple helper to extract first <table>...</table> block from markdown/html
  const extractTableHtml = (text: string): string | null => {
    const match = text.match(/<table[\s\S]*?<\/table>/i);
    return match ? match[0] : null;
  };

  const buildHtmlTableFromPlain = (text: string): string | null => {
    // Look for a line with two or more tab/space separated tokens that appear to be header
    const lines = text.split(/\r?\n/).filter(l=>l.trim());
    const headerIdx = lines.findIndex(l=>/STORE\s*[_ ]?NO/i.test(l) && /LEASE/i.test(l));
    if(headerIdx===-1) return null;
    const rows: string[][] = [];
    const headerParts = lines[headerIdx].split(/\t| {2,}/).map(s=>s.trim()).filter(Boolean);
    if(headerParts.length<2) return null;
    rows.push(headerParts);
    for(let i=headerIdx+1;i<lines.length;i++){
      const parts = lines[i].split(/\t| {2,}/).map(s=>s.trim());
      if(parts.length>=2){
        rows.push([parts[0], parts.slice(1).join(' ')]);
      } else break;
    }
    if(rows.length<=1) return null;
    // Build HTML
    const ths = rows[0].map(h=>`<th>${h}</th>`).join('');
    const trs = rows.slice(1).map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  };

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: `1px solid ${theme.palette.mode==='dark'?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.08)'}`, bgcolor: theme.palette.mode==='dark' ? '#232323' : '#ffffff' }}>
        <Typography variant="subtitle1">Canvas</Typography>
        <IconButton size="small" onClick={close}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      {activeMessage && (
        <Tabs value={tab} onChange={handleTabChange} sx={{ px: 2 }}>
          <Tab label="Document" />
          <Tab label="Data" />
          <Tab label="Visualization" />
        </Tabs>
      )}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {activeMessage ? (
          tab === 0 ? (
            <MarkdownRenderer markdown={activeMessage.text} />
          ) : tab === 1 ? (
            (()=>{
              let tableHtml = extractTableHtml(activeMessage.text);
              if(!tableHtml){
                tableHtml = buildHtmlTableFromPlain(activeMessage.text);
              }
              return tableHtml ? (
                <Box sx={{ overflowX:'auto' }} dangerouslySetInnerHTML={{ __html: tableHtml }} />
              ) : (
                <Typography variant="body2" color="text.secondary">No table detected in this response.</Typography>
              );
            })()
          ) : (
            (() => {
              if (activeMessage.text.startsWith('#chart:')) {
                const chartType = activeMessage.text.substring(7);
                let sampleConfig: ChartConfig;
                switch(chartType){
                  case 'pie':
                    sampleConfig = {
                      type:'pie',
                      options:{ labels:['A','B','C','D'] },
                      series:[30,40,25,35],
                    } as any;
                    break;
                  case 'horizontalBar':
                  case 'bar':
                  case 'line':
                  case 'area':
                  default:
                    sampleConfig = {
                      type: chartType as any,
                      options:{ xaxis:{ categories:['A','B','C','D'] } },
                      series:[{ name:'Series 1', data:[30,50,40,60] }],
                    } as any;
                    break;
                  case 'stackedBar':
                    sampleConfig = {
                      type:'stackedBar',
                      options:{ xaxis:{ categories:['Q1','Q2','Q3','Q4'] } },
                      series:[
                        { name:'Online', data:[120,150,170,200] },
                        { name:'In-store', data:[200,220,210,230] },
                      ],
                    } as any;
                    break;
                  case 'geo':
                    sampleConfig = { type:'geo', options:{}, series:[] } as any;
                    break;
                }
                return (
                  <Box sx={{ textAlign:'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb:1, display:'block' }}>
                       (Demo – static sample data)
                    </Typography>
                    <ChartFactory {...sampleConfig} />
                  </Box>
                );
              }
              return <Typography variant="body2">Visualizations would appear here.</Typography>;
            })()
          )
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select a message to view in the canvas.
          </Typography>
        )}
      </Box>
    </Box>
  );

  if (isSmall) {
    return (
      <Drawer anchor="right" open={isOpen} onClose={close} PaperProps={{ sx: { width: '80%' } }}>
        {content}
      </Drawer>
    );
  }

  // Desktop panel – always rendered for smooth width transition
  return (
    <Box
      sx={{
        width: isOpen ? width : 0,
        minWidth: isOpen ? 380 : 0,
        maxWidth: '60%',
        height: '100vh',
        transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
        borderLeft: isOpen ? `1px solid ${theme.palette.mode==='dark'?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.08)'}` : 'none',
        backgroundColor: theme.palette.mode==='dark' ? '#1e1e1e' : '#fafafa',
        display: isOpen || width!==0 ? 'flex' : 'none',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Drag handle */}
      {isOpen && (
        <Box
          sx={{
            position: 'absolute',
            left: -12,
            top: 0,
            width: 12,
            height: '100%',
            cursor: 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
          onMouseDown={(e)=>{
            const startX = e.clientX;
            const startWidth = width;
            const onMove = (ev: MouseEvent)=>{
              const delta = startX - ev.clientX;
              const newW = Math.min(Math.max(startWidth + delta, 380), window.innerWidth*0.6);
              setWidth(newW);
            };
            const onUp = ()=>{
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        >
          <KeyboardDoubleArrowLeftIcon fontSize="small" sx={{ color: theme.palette.mode==='dark' ? '#aaa':'#666' }} />
        </Box>
      )}
      {content}
    </Box>
  );
};

export default React.memo(CanvasPanel); 