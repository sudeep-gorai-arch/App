import React, { useEffect, useRef } from "react";

import {
  Animated,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { CommonActions, useNavigation } from "@react-navigation/native";

import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "../context/AuthContext";

export type PremiumReturnRoute =
  | "Home"
  | "Category"
  | "Trending"
  | "Favorites"
  | "Profile"
  | "Settings";

type PremiumActionButtonProps = {
  returnTo?: PremiumReturnRoute;
  style?: StyleProp<ViewStyle>;
};

const proButtonIcon = require("../assets/images/pro-button.png");

const isPremiumActive = (user: any) => {
  if (!user) {
    return false;
  }

  const premiumUntilValue =
    user.premiumUntil ||
    user.premium_until ||
    user.subscription?.premiumUntil ||
    user.subscription?.premium_until;

  const premiumUntilTime = premiumUntilValue
    ? new Date(premiumUntilValue).getTime()
    : 0;

  const hasActivePremiumDate =
    Number.isFinite(premiumUntilTime) && premiumUntilTime > Date.now();

  return Boolean(
    user.isPremium ||
      user.is_premium ||
      user.premium ||
      user.subscription?.active ||
      user.subscription?.isPremium ||
      user.subscription?.is_premium ||
      hasActivePremiumDate,
  );
};

const getRootNavigation = (navigation: any) => {
  let rootNavigation = navigation;
  let parentNavigation = navigation?.getParent?.();

  while (parentNavigation) {
    rootNavigation = parentNavigation;
    parentNavigation = rootNavigation?.getParent?.();
  }

  return rootNavigation;
};

export const usePremiumNavigation = (
  returnTo: PremiumReturnRoute = "Home",
) => {
  const navigation = useNavigation<any>();

  const { user } = useAuth();

  const openPremium = () => {
    const rootNavigation = getRootNavigation(navigation);

    const screenName = isPremiumActive(user) ? "ManagePremium" : "Premium";

    rootNavigation.dispatch(
      CommonActions.navigate({
        name: screenName,
        params: {
          returnTo,
        },
      }),
    );
  };

  return openPremium;
};

const ShinyProIcon = () => {
  const shineTranslate = useRef(new Animated.Value(-48)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),

        Animated.timing(shineTranslate, {
          toValue: 48,
          duration: 950,
          useNativeDriver: true,
        }),

        Animated.timing(shineTranslate, {
          toValue: -48,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shineTranslate]);

  return (
    <View style={styles.iconWrap}>
      <Image source={proButtonIcon} style={styles.icon} resizeMode="contain" />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.shine,
          {
            transform: [{ translateX: shineTranslate }, { rotate: "18deg" }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.18)",
            "rgba(255,255,255,0.85)",
            "rgba(255,255,255,0.18)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shineGradient}
        />
      </Animated.View>
    </View>
  );
};

const PremiumActionButton = ({
  returnTo = "Home",
  style,
}: PremiumActionButtonProps) => {
  const openPremium = usePremiumNavigation(returnTo);

  return (
    <Pressable
      onPress={openPremium}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open premium"
      style={({ pressed }) => [
        styles.button,
        style,
        {
          opacity: pressed ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <ShinyProIcon />
    </Pressable>
  );
};

export default PremiumActionButton;

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    backgroundColor: "transparent",
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  icon: {
    width: 36,
    height: 36,
  },

  shine: {
    position: "absolute",
    top: -12,
    bottom: -12,
    width: 14,
  },

  shineGradient: {
    flex: 1,
  },
});