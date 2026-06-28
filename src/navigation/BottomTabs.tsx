import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
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

const HIDDEN_TAB_ROUTES = ['Premium'];

const ACTIVE_PILL_WIDTH = 50;
const ACTIVE_PILL_HEIGHT = 34;

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

  const [tabsWidth, setTabsWidth] = useState(0);

  const pillTranslateX = useRef(new Animated.Value(0)).current;
  const pillOpacity = useRef(new Animated.Value(0)).current;

  const pillScaleX = useRef(new Animated.Value(1)).current;
  const pillScaleY = useRef(new Animated.Value(1)).current;

  const previousActiveIndexRef = useRef(-1);

  const activeTabIndex = TAB_ITEMS.findIndex(
    item => item.routeName === activeRoute,
  );

  const tabWidth = tabsWidth / TAB_ITEMS.length;

  useEffect(() => {
    if (!tabsWidth || activeTabIndex < 0) {
      Animated.timing(pillOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }).start();

      return;
    }

    const targetX =
      activeTabIndex * tabWidth + (tabWidth - ACTIVE_PILL_WIDTH) / 2;

    const previousIndex = previousActiveIndexRef.current;
    const distance =
      previousIndex >= 0 ? Math.abs(activeTabIndex - previousIndex) : 0;

    previousActiveIndexRef.current = activeTabIndex;

    const verticalStretch =
      distance > 0 ? Math.min(1.72, 1.28 + distance * 0.14) : 1;

    const horizontalStretch =
      distance > 0 ? Math.min(1.22, 1.06 + distance * 0.04) : 1;

    const stretchDuration = Math.min(230, 130 + distance * 28);

    pillScaleX.stopAnimation();
    pillScaleY.stopAnimation();

    pillScaleX.setValue(1);
    pillScaleY.setValue(1);

    Animated.parallel([
      Animated.spring(pillTranslateX, {
        toValue: targetX,
        useNativeDriver: true,
        friction: 8,
        tension: 120,
      }),

      Animated.timing(pillOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),

      Animated.sequence([
        Animated.parallel([
          Animated.timing(pillScaleY, {
            toValue: verticalStretch,
            duration: stretchDuration,
            useNativeDriver: true,
          }),

          Animated.timing(pillScaleX, {
            toValue: horizontalStretch,
            duration: stretchDuration,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.spring(pillScaleY, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 130,
          }),

          Animated.spring(pillScaleX, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 130,
          }),
        ]),
      ]),
    ]).start();
  }, [
    activeTabIndex,
    pillOpacity,
    pillScaleX,
    pillScaleY,
    pillTranslateX,
    tabWidth,
    tabsWidth,
  ]);

  if (HIDDEN_TAB_ROUTES.includes(activeRoute)) {
    return null;
  }

  const onTabsLayout = (event: LayoutChangeEvent) => {
    setTabsWidth(event.nativeEvent.layout.width);
  };

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

        <View style={styles.tabsRow} onLayout={onTabsLayout}>
          {tabsWidth > 0 && activeTabIndex >= 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.slidingPillWrap,
                {
                  opacity: pillOpacity,
                  transform: [
                    { translateX: pillTranslateX },
                    { scaleY: pillScaleY },
                    { scaleX: pillScaleX },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={gradients.blueViolet}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.slidingPill}
              />
            </Animated.View>
          ) : null}

          {TAB_ITEMS.map(item => {
            const isActive = item.routeName === activeRoute;
            const tint = isActive ? colors.textPrimary : colors.textTertiary;

            return (
              <Pressable
                key={item.key}
                style={styles.tab}
                onPress={() => {
                  if (item.routeName && item.routeName !== activeRoute) {
                    navigation.navigate(item.routeName as never);
                  }
                }}
              >
                <View style={styles.iconHolder}>
                  <TabIcon icon={item.icon} color={tint} />
                </View>

                <Text style={[styles.tabLabel, { color: tint }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
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
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  slidingPillWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ACTIVE_PILL_WIDTH,
    height: ACTIVE_PILL_HEIGHT,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  slidingPill: {
    width: ACTIVE_PILL_WIDTH,
    height: ACTIVE_PILL_HEIGHT,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconHolder: {
    width: 44,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});