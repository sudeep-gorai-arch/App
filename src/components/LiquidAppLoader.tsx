import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { colors } from "../styles/colors";
import { radius, spacing, SCREEN } from "../utils/constants";

const appIcon = require("../assets/images/app-icon.png");

const ICON_SIZE = 116;

const LiquidAppLoader = ({
  label = "Loading FlexiWalls",
  sublabel = "Preparing premium wallpapers",
}: {
  label?: string;
  sublabel?: string;
}) => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: 6800,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const waveLoop = Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2800,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    waveLoop.start();
    pulseLoop.start();
    shineLoop.start();

    return () => {
      waveLoop.stop();
      pulseLoop.stop();
      shineLoop.stop();
    };
  }, [fillAnim, pulseAnim, shineAnim, waveAnim]);

  const fillTranslateY = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [ICON_SIZE, 0],
  });

  const waveTranslateX = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-38, 18, 38],
  });

  const waveTranslateY = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -5, 0],
  });

  const secondWaveTranslateX = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [34, -12, -34],
  });

  const secondWaveTranslateY = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-2, 4, -2],
  });

  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.34, 0.68],
  });

  const shineTranslateX = shineAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-ICON_SIZE, ICON_SIZE],
  });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.base, "#111018", "#15111F", colors.base]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.blurOrbOne} />
      <View style={styles.blurOrbTwo} />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.outerGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      <View style={styles.iconShell}>
        <View style={styles.iconInner}>
          <Image source={appIcon} style={styles.iconBase} resizeMode="cover" />

          <Animated.View
            style={[
              styles.liquidFill,
              {
                transform: [{ translateY: fillTranslateY }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                "rgba(167,139,250,0.96)",
                "rgba(236,72,153,0.92)",
                "rgba(96,165,250,0.9)",
              ]}
              start={{ x: 0.12, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.liquidGradient}
            />

            <Animated.View
              style={[
                styles.wave,
                {
                  transform: [
                    { translateX: waveTranslateX },
                    { translateY: waveTranslateY },
                  ],
                },
              ]}
            />

            <Animated.View
              style={[
                styles.waveSoft,
                {
                  transform: [
                    { translateX: secondWaveTranslateX },
                    { translateY: secondWaveTranslateY },
                  ],
                },
              ]}
            />

            <Animated.View
              style={[
                styles.waveHighlight,
                {
                  transform: [
                    { translateX: waveTranslateX },
                    { translateY: waveTranslateY },
                  ],
                },
              ]}
            />
          </Animated.View>

          <Image source={appIcon} style={styles.iconOverlay} resizeMode="cover" />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.shine,
              {
                transform: [
                  { translateX: shineTranslateX },
                  { rotate: "18deg" },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.2)",
                "rgba(255,255,255,0.7)",
                "rgba(255,255,255,0.2)",
                "rgba(255,255,255,0)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.shineGradient}
            />
          </Animated.View>
        </View>
      </View>

      <Text style={styles.title}>{label}</Text>
      <Text style={styles.subtitle}>{sublabel}</Text>

      <View style={styles.loadingDots}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotMiddle]} />
        <View style={styles.dot} />
      </View>
    </View>
  );
};

export default LiquidAppLoader;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: SCREEN.width,
    backgroundColor: colors.base,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  blurOrbOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(139,92,246,0.16)",
    top: SCREEN.height * 0.16,
    left: -90,
  },

  blurOrbTwo: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(236,72,153,0.12)",
    bottom: SCREEN.height * 0.16,
    right: -80,
  },

  outerGlow: {
    position: "absolute",
    width: ICON_SIZE + 54,
    height: ICON_SIZE + 54,
    borderRadius: radius.xl + 28,
    backgroundColor: "rgba(167,139,250,0.26)",
  },

  iconShell: {
    width: ICON_SIZE + 18,
    height: ICON_SIZE + 18,
    borderRadius: 34,
    padding: 9,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    shadowColor: colors.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },

  iconInner: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#09090B",
  },

  iconBase: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
    opacity: 0.2,
  },

  liquidFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: ICON_SIZE,
  },

  liquidGradient: {
    flex: 1,
  },

  wave: {
    position: "absolute",
    top: -26,
    left: -42,
    width: ICON_SIZE + 84,
    height: 54,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.34)",
  },

  waveSoft: {
    position: "absolute",
    top: -16,
    left: -34,
    width: ICON_SIZE + 68,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  waveHighlight: {
    position: "absolute",
    top: -8,
    left: -28,
    width: ICON_SIZE + 56,
    height: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  iconOverlay: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
    opacity: 0.42,
  },

  shine: {
    position: "absolute",
    top: -22,
    bottom: -22,
    width: 28,
    opacity: 0.76,
  },

  shineGradient: {
    flex: 1,
  },

  title: {
    marginTop: spacing.xxl,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  loadingDots: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.32)",
  },

  dotMiddle: {
    backgroundColor: colors.accent,
  },
});