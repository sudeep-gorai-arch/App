import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { colors } from '../styles/colors';

type Props = {
  variant?: 'home' | 'category' | 'profile' | 'about';
  textureOpacity?: number;
};

const MeshBackground: React.FC<Props> = ({ textureOpacity = 0.18 }) => {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.base} />
      <Image
        source={require('../assets/images/backgrounds/dark-texture.png')}
        style={[styles.texture, { opacity: textureOpacity }]}
        resizeMode="cover"
      />
    </View>
  );
};

export default MeshBackground;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  base: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.base,
  },
  texture: {
    ...StyleSheet.absoluteFill,
    width: undefined,
    height: undefined,
  },
});