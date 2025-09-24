import { FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';

// Mapeamento de bibliotecas de ícones
const iconLibraries = {
  Ionicons,
  Material: MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome,
  FontAwesome5,
};

export function DynamicIcon({ 
  name, 
  size = 24, 
  color = '#333', 
  library = 'Ionicons',
  style 
}) {
  const IconComponent = iconLibraries[library] || Ionicons;

  return (
    <IconComponent
      name={name}
      size={size}
      color={color}
      style={style}
    />
  );
}

// Função helper para renderizar ícones em listas
export const renderIcon = (item, defaultSize = 40, defaultColor = '#333') => {
  const iconProps = {
    name: item.icon,
    size: item.iconSize || defaultSize,
    color: item.iconColor || defaultColor,
    library: item.iconLib || 'Ionicons'
  };

  return <DynamicIcon {...iconProps} />;
}; 