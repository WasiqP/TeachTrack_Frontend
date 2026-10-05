/**
 * PulseBox Web Form Viewer - Theme Configuration
 * 
 * This file allows developers to easily customize the styling of the web form viewer.
 * Modify the values below to change colors, spacing, fonts, and other design elements.
 * 
 * After making changes, the form will automatically use the new styling.
 */

const THEME_CONFIG = {
  // ============================================
  // COLOR PALETTE
  // ============================================
  colors: {
    // Primary Brand Colors
    primary: '#A060FF',           // Main purple color
    primaryDark: '#8A4DE6',       // Darker shade for hover states
    primaryLight: '#E0CBFF',       // Light purple tint
    
    // Accent Colors
    accent: '#00E4E3',             // Aqua blue accent
    accentDark: '#00B8B7',         // Darker aqua for hover
    
    // Background Colors
    background: '#FEFDFF',         // Soft white background
    backgroundAlt: '#F8F5FF',      // Light lavender background
    cardBackground: '#FFFFFF',     // Card/container background
    
    // Text Colors
    textPrimary: '#000000',        // Main text color
    textSecondary: '#666666',       // Secondary text
    textTertiary: '#999999',       // Tertiary/muted text
    textInverse: '#FFFFFF',        // White text for dark backgrounds
    
    // Border Colors
    border: '#E0E0E0',             // Default border
    borderLight: '#F0F0F0',        // Light border
    borderDark: '#CCCCCC',         // Dark border
    
    // Status Colors
    success: '#4CAF50',            // Success/green
    error: '#F44336',              // Error/red
    warning: '#FF9800',            // Warning/orange
    info: '#2196F3',               // Info/blue
  },

  // ============================================
  // SPACING & LAYOUT
  // ============================================
  spacing: {
    // Base spacing unit (all spacing is multiples of this)
    unit: 8,                       // 8px base unit
    
    // Padding
    paddingXS: 8,                   // 8px
    paddingSM: 12,                  // 12px
    paddingMD: 16,                  // 16px
    paddingLG: 24,                  // 24px
    paddingXL: 32,                  // 32px
    paddingXXL: 48,                 // 48px
    
    // Margin
    marginXS: 8,                    // 8px
    marginSM: 12,                  // 12px
    marginMD: 16,                  // 16px
    marginLG: 24,                  // 24px
    marginXL: 32,                  // 32px
    marginXXL: 48,                 // 48px
    
    // Container
    containerMaxWidth: '800px',    // Max width of form container
    containerPadding: '24px',      // Horizontal padding for container
    containerPaddingMobile: '16px', // Mobile container padding
    
    // Section spacing
    sectionSpacing: 32,            // Space between form sections
    fieldSpacing: 24,               // Space between form fields
  },

  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    // Font Families
    fontFamily: {
      primary: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      heading: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      body: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    
    // Font Sizes
    fontSize: {
      xs: '12px',                  // Extra small
      sm: '14px',                  // Small
      base: '16px',                // Base/body text
      lg: '18px',                  // Large
      xl: '24px',                  // Extra large
      '2xl': '32px',               // 2X large
      '3xl': '40px',               // 3X large
    },
    
    // Font Weights
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // ============================================
  // BORDER RADIUS
  // ============================================
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // ============================================
  // SHADOWS
  // ============================================
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },

  // ============================================
  // FORM ELEMENTS
  // ============================================
  form: {
    // Input fields
    inputHeight: '48px',           // Height of input fields
    inputPadding: '12px 16px',     // Padding inside inputs
    inputBorderWidth: '1px',       // Border width
    inputBorderRadius: '12px',      // Input border radius
    
    // Buttons
    buttonHeight: '48px',          // Height of buttons
    buttonPadding: '14px 24px',    // Padding inside buttons
    buttonBorderRadius: '12px',    // Button border radius
    buttonFontWeight: 600,         // Button font weight
    
    // Field labels
    labelMarginBottom: '8px',      // Space below label
    labelFontSize: '14px',        // Label font size
    labelFontWeight: 600,         // Label font weight
    
    // Helper text
    helperTextMarginTop: '6px',   // Space above helper text
    helperTextFontSize: '12px',   // Helper text size
    
    // Required indicator
    requiredColor: '#F44336',     // Color for required asterisk
  },

  // ============================================
  // BREAKPOINTS (for responsive design)
  // ============================================
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },

  // ============================================
  // ANIMATIONS
  // ============================================
  animations: {
    transitionDuration: '0.2s',
    transitionTiming: 'ease-in-out',
  },
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = THEME_CONFIG;
}


