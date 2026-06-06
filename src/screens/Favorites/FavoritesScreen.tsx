import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ImageBackground,
  Pressable,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';

import { colors } from '../../styles/colors';

import { spacing, radius, TRENDING } from '../../utils/constants';

const FavoritesScreen = () => {
  return (
    <View style={styles.root}>
      <MeshBackground variant="home" />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>

          <Text style={styles.subtitle}>Your saved wallpapers ❤️</Text>
        </View>

        <FlatList
          data={TRENDING}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.card}>
              <ImageBackground
                source={{
                  uri: item.image,
                }}
                style={styles.image}
                imageStyle={{
                  borderRadius: radius.md,
                }}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      borderRadius: radius.md,
                    },
                  ]}
                />

                <View style={styles.bottom}>
                  <Ionicons name="heart" size={18} color="white" />

                  <Text style={styles.likes}>{item.likes}</Text>
                </View>
              </ImageBackground>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </View>
  );
};

export default FavoritesScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  header: {
    padding: spacing.xl,
  },

  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '900',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
  },

  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },

  card: {
    width: '48%',
    height: 260,
    margin: '1%',
    borderRadius: radius.md,
    overflow: 'hidden',
  },

  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  bottom: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    padding: 15,
  },

  likes: {
    color: 'white',
    fontWeight: '700',
  },
});
