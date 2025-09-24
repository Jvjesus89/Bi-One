import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { getCardStyle, homeStyles } from '../../styles/home.styles';

const options = [
  { id: '1', title: 'Orçamentos', icon: 'cart-outline', lib: 'Material', route: '/sales' },
  { id: '2', title: 'Financeiro', icon: 'cash-outline', lib: 'Material', route: '/financial' },
  { id: '3', title: 'Serviços / Produtos', icon: 'cube-outline', lib: 'Material', route: '/products' },
  //{ id: '4', title: 'Estoque', icon: 'package-variant', iconLib: 'Material', route: '/stock' },
  { id: '4', title: 'Relatórios', icon: 'document-text-outline' },
  { id: '5', title: 'Clientes', icon: 'account-circle	', lib: 'MaterialCommunityIcons', route: '/clients' },
];
export default function HomeScreen({ navigation }) {
  const router = useRouter();

  const handleCardPress = (item) => {
    if (item.route) {
      router.push(item.route);
    } else {
      console.log(`Clicou em: ${item.title}`);
      // Aqui você pode adicionar navegação para outras telas quando implementadas
    }
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity 
      style={[homeStyles.card, getCardStyle(index)]} 
      onPress={() => handleCardPress(item)}
    >
      <DynamicIcon
        name={item.icon}
        size={40}
        color="#333"
        library={item.iconLib || 'Ionicons'}
      />
      <Text style={homeStyles.title}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={homeStyles.container}>
      <FlatList
        data={options}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={homeStyles.grid}
      />
    </View>
  );
}

