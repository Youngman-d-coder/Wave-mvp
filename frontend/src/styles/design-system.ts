// Design System for WAVE MVP
// Primary: Orange (#F97316) - Energetic, warm, action-oriented
// Background: White (#FFFFFF) with dark mode option (#0F0F0F)
// Typography: Inter (body) + Space Grotesk (headings) - Modern, geometric, tech-forward

export const colors = {
  primary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316', // Main orange
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  dark: {
    bg: '#0F0F0F',
    card: '#1A1A1A',
    border: '#2A2A2A',
    text: '#FFFFFF',
    muted: '#A1A1AA',
  },
  light: {
    bg: '#FFFFFF',
    card: '#FAFAFA',
    border: '#E4E4E7',
    text: '#18181B',
    muted: '#71717A',
  },
  semantic: {
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
    info: '#3B82F6',
  }
};

export const typography = {
  heading: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  glow: '0 0 20px rgba(249, 115, 22, 0.3)',
};

export const animations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
