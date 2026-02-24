import React from 'react';

export const ThemeContext = React.createContext({
  primary: '#F97316', // Orange-500
  background: '#0F172A', // Slate-900
  surface: '#1E293B', // Slate-800
});

export const useTheme = () => React.useContext(ThemeContext);
