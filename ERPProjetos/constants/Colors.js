// constants/Colors.js

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    textLight: '#65676b',
    background: '#f0f2f5',
    white: '#ffffff', 
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // --- Cores adicionadas para consistência na UI ---
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745', 
    danger: '#dc3545', 
    warning: '#ffc107', 
    info: '#17a2b8',
    border: '#dddfe2',
    shadow: '#000',
  },
  dark: {
    text: '#ECEDEE',
    textLight: '#a9b1ba', 
    background: '#151718',
    white: '#242526',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,

    // --- Cores adicionadas para consistência na UI ---
    primary: '#007bff',
    secondary: '#898e92',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    border: '#4d4d4d',
    shadow: '#000',
  },
};