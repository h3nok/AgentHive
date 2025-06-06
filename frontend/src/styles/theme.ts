import { createTheme } from "@mui/material/styles";

// Tractor Supply Co. colors - with toned down red
export const tractorSupplyColors = {
  red: "#E31937", // Tractor Supply Co. red
  softRed: "#D9364D", // Softer red for main UI elements
  black: "#000000",
  darkGray: "#333333",
  mediumGray: "#696969",
  lightGray: "#F5F5F5",
  offWhite: "#FAFAFA",
  white: "#FFFFFF",
  green: "#006837", // Complementary color for success messages
  yellow: "#FFD100", // For warning/important elements
};

// Define light theme colors for Tractor Supply Co. - more enterprise-focused
const lightPalette = {
  primary: {
    main: tractorSupplyColors.softRed,
    light: "#E8899A", // Much lighter version of red
    dark: "#B90F29", // Darker version of red
    contrastText: tractorSupplyColors.white,
  },
  secondary: {
    main: tractorSupplyColors.darkGray,
    light: tractorSupplyColors.mediumGray,
    dark: "#222222",
    contrastText: tractorSupplyColors.white,
  },
  background: {
    default: tractorSupplyColors.offWhite,
    paper: tractorSupplyColors.white,
  },
  text: {
    primary: tractorSupplyColors.darkGray,
    secondary: tractorSupplyColors.mediumGray,
  },
  success: {
    main: tractorSupplyColors.green,
  },
  warning: {
    main: tractorSupplyColors.yellow,
  },
  divider: "rgba(0, 0, 0, 0.08)",
};

// Define dark theme colors
const darkPalette = {
  primary: {
    main: tractorSupplyColors.softRed,
    light: "#E8899A",
    dark: "#B90F29",
    contrastText: tractorSupplyColors.white,
  },
  secondary: {
    main: "#9E9E9E", // Lighter gray for dark mode
    light: "#BDBDBD",
    dark: "#757575",
    contrastText: tractorSupplyColors.white,
  },
  background: {
    default: "#121212",
    paper: "#1E1E1E",
  },
  text: {
    primary: tractorSupplyColors.white,
    secondary: "#B0B0B0",
  },
  success: {
    main: tractorSupplyColors.green,
  },
  warning: {
    main: tractorSupplyColors.yellow,
  },
  divider: "rgba(255, 255, 255, 0.08)",
};

// Function to create theme based on mode
export const createAppTheme = (mode: "light" | "dark") => {
  const palette = mode === "light" ? lightPalette : darkPalette;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#D9364D', // Subtle use of primary color
      },
      secondary: {
        main: '#4A4A4A',
      },
      background: {
        default: mode === 'light' ? '#F5F5F5' : '#303030',
        paper: mode === 'light' ? '#FFFFFF' : '#424242',
      },
      text: {
        primary: mode === 'light' ? '#333333' : '#FFFFFF',
        secondary: mode === 'light' ? '#666666' : '#B0B0B0',
      },
      success: {
        main: tractorSupplyColors.green,
      },
      warning: {
        main: tractorSupplyColors.yellow,
      },
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
      h6: {
        fontWeight: 600,
      },
      body1: {
        fontSize: '1rem',
      },
      body2: {
        fontSize: '0.875rem',
      },
      caption: {
        fontSize: '0.75rem',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            '&:hover': {
              backgroundColor: 'rgba(217, 54, 77, 0.1)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderRadius: 8,
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            width: 36,
            height: 36,
            fontSize: "1rem",
            backgroundColor: mode === "light" 
              ? lightPalette.primary.light
              : darkPalette.primary.main,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: mode === "light" 
              ? "rgba(0, 0, 0, 0.08)"
              : "rgba(255, 255, 255, 0.08)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
          },
          colorPrimary: {
            backgroundColor: mode === "light"
              ? "rgba(217, 54, 77, 0.1)" // Very light red
              : "rgba(217, 54, 77, 0.2)", // Semi-transparent red for dark mode
            color: mode === "light" 
              ? lightPalette.primary.dark
              : darkPalette.primary.light,
          },
        },
      },
    },
  });
};

