
import React from 'react';
import { Text } from 'react-native';
import { Button,Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions } from 'react-native';

export default function ErrorButton({text}) : React.ReactElement {
    const {width} = useWindowDimensions();
  return (
    <Card
        style={{ 
            width: width > 768 ? 14 : 300,
            borderRadius: 8, 
            overflow: 'hidden',
            marginBottom: 12,
            backgroundColor: '#FF2626'
        }}
    >
        <Button >
          <Text className="text-xl text-white">{text}</Text>
        </Button>
    </Card>
  );
}
