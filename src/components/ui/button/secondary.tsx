import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions } from 'react-native';

export default function SecondaryButton({ text }): React.ReactElement {
  const { width } = useWindowDimensions();

  return (
    <LinearGradient
      colors={['#7ED321', '#00A651']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        borderRadius: 8, 
        padding: 2,
        width: width > 768 ? 140 : 300,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 6,
          paddingVertical: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#00A651', fontSize: 18 }}>{text}</Text>
      </View>
    </LinearGradient>
  );
}
