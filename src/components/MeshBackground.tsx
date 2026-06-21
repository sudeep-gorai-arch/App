import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  variant?: 'home' | 'category' | 'profile' | 'about';
};

const MeshBackground: React.FC<Props> = () => {
  return <View pointerEvents="none" style={styles.blackBackground} />;
};

export default MeshBackground;

const styles = StyleSheet.create({
  blackBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#000000',
  },
});