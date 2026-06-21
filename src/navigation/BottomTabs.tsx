import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/Home/HomeScreen';
import AboutScreen from '../screens/About/AboutScreen';
import CategoryScreen from '../screens/Category/CategoryScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import FavoritesScreen from '../screens/Favorites/FavoritesScreen';
import PremiumScreen from '../screens/Premium/PremiumScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import TrendingScreen from '../screens/Trending/TrendingScreen';

import { colors, gradients } from '../styles/colors';
import { TAB_ITEMS } from '../utils/constants';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, color }: { icon: string; color: string }) => {
  if (icon === 'crown') {
    return (
      <MaterialCommunityIcons name="crown-outline" size={22} color={color} />
    );
  }

  return (
    <Ionicons
      name={icon as keyof typeof Ionicons.glyphMap}
      size={22}
      color={color}
    />
  );
};

const GlassTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;

  return (
    <View
      style={[styles.barWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <BlurView intensity={55} tint="dark" style={styles.bar}>
        <LinearGradient
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {TAB_ITEMS.map(item => {
          const isActive = item.routeName === activeRoute;
          const tint = isActive ? colors.textPrimary : colors.textTertiary;

          return (
            <Pressable
              key={item.key}
              style={styles.tab}
              onPress={() => {
                if (item.routeName) {
                  navigation.navigate(item.routeName as never);
                }
              }}
            >
              {isActive ? (
                <LinearGradient
                  colors={gradients.blueViolet}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activePill}
                >
                  <TabIcon icon={item.icon} color={colors.textPrimary} />
                </LinearGradient>
              ) : (
                <View style={styles.iconHolder}>
                  <TabIcon icon={item.icon} color={tint} />
                </View>
              )}

              <Text style={[styles.tabLabel, { color: tint }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
};

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={props => <GlassTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Category" component={CategoryScreen} />
      <Tab.Screen name="Trending" component={TrendingScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />

      <Tab.Screen name="About" component={AboutScreen} />
      <Tab.Screen name="Premium" component={PremiumScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    paddingHorizontal: 4,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: 'rgba(20, 18, 40, 0.45)',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHolder: {
    width: 44,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    width: 50,
    height: 34,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});