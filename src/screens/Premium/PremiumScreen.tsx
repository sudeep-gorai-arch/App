import React from 'react';

import { View, Text, StyleSheet, Pressable } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { BlurView } from 'expo-blur';

import MeshBackground from '../../components/MeshBackground';

import { colors } from '../../styles/colors';

import { spacing, radius } from '../../utils/constants';

const PremiumScreen = () => {
  return (
    <View style={styles.root}>
      <MeshBackground variant="home" />

      <SafeAreaView style={styles.container}>
        <Text style={styles.crown}>👑</Text>

        <Text style={styles.title}>Vivid Premium</Text>

        <Text style={styles.subtitle}>
          Unlimited 8K wallpapers, exclusive drops & no ads
        </Text>

        <BlurView intensity={35} tint="dark" style={styles.card}>
          <Text style={styles.price}>₹99/month</Text>

          <Text style={styles.item}>✓ 8K Ultra HD Collection</Text>

          <Text style={styles.item}>✓ Remove Ads</Text>

          <Text style={styles.item}>✓ Premium Wallpapers</Text>

          <Text style={styles.item}>✓ Daily Updates</Text>

          <Pressable style={styles.button}>
            <Text style={styles.btnText}>Upgrade Now</Text>
          </Pressable>
        </BlurView>
      </SafeAreaView>
    </View>
  );
};

export default PremiumScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },

  crown: {
    fontSize: 70,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 36,
    fontWeight: '900',
  },

  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 20,
  },

  card: {
    width: '100%',
    padding: 30,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },

  price: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 20,
  },

  item: {
    color: 'white',
    fontSize: 16,
    marginVertical: 8,
  },

  button: {
    height: 55,
    backgroundColor: '#7657ff',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  btnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 17,
  },
});
