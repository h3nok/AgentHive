import { createTheme } from '@mui/material/styles';

const tscColors = {
  red: '#c8102e',
  tan: '#f5e9d5',
  hay: '#c4c1b9',
  barn: '#efe4d8',
  earth: '#e6d3ba',
  gray: '#5f5f5f',
  night: '#1e1e1e',
  darkTan: '#3b2f2f',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: tscColors.red,
    },
    secondary: {
      main: '#444',
    },
    background: {
      default: '#fcf9f6',
      paper: tscColors.hay,
    },
    text: {
      primary: '#2e2e2e',
      secondary: '#5e5e5e',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: tscColors.hay,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(to right, ${tscColors.hay}, ${tscColors.barn})`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: `linear-gradient(to bottom, ${tscColors.hay}, ${tscColors.barn})`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(200,16,46,0.06)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected, &.Mui-selected:hover': {
            backgroundColor: 'rgba(200,16,46,0.15)',
            color: '#c8102e',
          },
          '&:hover': {
            backgroundColor: 'rgba(200,16,46,0.12)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          color: tscColors.red,
          borderRadius: '50%',
          width: 36,
          height: 36,
          boxShadow: '0 1px 4px rgba(200,16,46,0.2)',
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: 'rgba(200,16,46,0.08)',
          },
          '&:disabled': {
            backgroundColor: 'rgba(0,0,0,0.04)',
            color: 'rgba(0,0,0,0.26)',
            boxShadow: 'none',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Roboto Slab", serif',
    h6: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    body1: {
      fontSize: '0.95rem',
    },
    caption: {
      fontSize: '0.75rem',
      color: '#999',
    },
  },
});

export const darkTheme = createTheme({
  ...theme,
  palette: {
    mode: 'dark',
    primary: {
      main: tscColors.red,
    },
    secondary: {
      main: '#aaa',
    },
    background: {
      default: tscColors.night,
      paper: tscColors.darkTan,
    },
    text: {
      primary: '#f5f5f5',
      secondary: '#bbb',
    },
  },
  components: {
    ...theme.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: tscColors.darkTan,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(to right, ${tscColors.night}, ${tscColors.darkTan})`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: `linear-gradient(to bottom, ${tscColors.night}, ${tscColors.darkTan})`,
        },
      },
    },
  },
});

export default theme; 