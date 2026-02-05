import React from 'react';
import { Text, View, Pressable } from 'react-native';
import {Button} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions } from 'react-native';

type EntryProps = {
  text: string; 
  action?:() => void; 
}

export default function SecondaryButton({ text, action = () => {} } : EntryProps): React.ReactElement {
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
      <Button
        onPress={action}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 6,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#00A651', fontSize: 18 }}>{text}</Text>
      </Button>
    </LinearGradient>
  );
}
