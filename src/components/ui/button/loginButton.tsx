import React from 'react';
import { View } from 'react-native';
import { Button,Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions } from 'react-native';

export default function LoginButton() {
    const {width} = useWindowDimensions();
  return (
    <Card
        style={{ 
            width: width > 768 ? 14 : 300,
            borderRadius: 8, 
            overflow: 'hidden',
            marginBottom: 12,
        }}
    >
      <LinearGradient
        colors={['#7ED321', '#00A651']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Button textColor="#FFFFFF">
          Ingresar
        </Button>
      </LinearGradient>
    </Card>
  );
}
