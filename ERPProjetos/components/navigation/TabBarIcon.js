import React from 'react';
import { StyleSheet } from 'react-native';
import { DynamicIcon } from '../ui/DynamicIcon';

export function TabBarIcon({ style, name, color, library = 'Ionicons' }) {
  return (
    <DynamicIcon 
      name={name} 
      size={28} 
      color={color} 
      library={library}
      style={[styles.tabBarIcon, style]} 
    />
  );
}

const styles = StyleSheet.create({
  tabBarIcon: {
    marginBottom: -3,
  },
}); 