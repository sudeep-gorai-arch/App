import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Share,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients } from '../../styles/colors';

import { spacing, radius } from '../../utils/constants';

import { useAuth } from '../../context/AuthContext';

const Row = ({ icon, title, subtitle, onPress, toggle, value }: any) => {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={26} color={colors.accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>

        {subtitle && <Text style={styles.sub}>{subtitle}</Text>}
      </View>

      {toggle ? (
        <Switch value={value} />
      ) : (
        <Ionicons name="chevron-forward" size={24} color="#777" />
      )}
    </Pressable>
  );
};

export default function SettingsScreen({ navigation }: any) {
  const { user, signInGoogle, logout } = useAuth();

  const [amoled, setAmoled] = useState(false);

  const [notify, setNotify] = useState(false);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 80,
          }}
        >
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={32} color="#fff" />
            </Pressable>

            <Text style={styles.heading}>Settings</Text>
          </View>

          <LinearGradient
            colors={gradients.violetMagenta}
            style={styles.premium}
          >
            <Text style={styles.premiumTitle}>Go Premium</Text>

            <Text style={styles.premiumSub}>
              Unlock Premium Wallpapers and remove ads
            </Text>

            <Pressable style={styles.start}>
              <Text style={styles.startText}>Get Started</Text>
            </Pressable>
          </LinearGradient>

          <View style={styles.quick}>
            <Pressable
              style={styles.quickBtn}
              onPress={() =>
                Share.share({
                  message: 'Try FlexiWalls wallpapers',
                })
              }
            >
              <Ionicons name="share-social" size={24} color="#4ade80" />

              <Text style={styles.quickText}>Share</Text>
            </Pressable>

            <Pressable style={styles.quickBtn}>
              <Ionicons name="star" size={24} color="#FFD700" />

              <Text style={styles.quickText}>Rate</Text>
            </Pressable>

            <Pressable style={styles.quickBtn}>
              <Ionicons name="mail" size={24} color="#38bdf8" />

              <Text style={styles.quickText}>Contact</Text>
            </Pressable>
          </View>

          <Text style={styles.section}>APPEARANCE</Text>

          <View style={styles.card}>
            <Row icon="color-palette" title="App Theme" subtitle="Dark" />

            <Row
              icon="moon"
              title="AMOLED Black"
              subtitle="Enable black background"
              toggle
              value={amoled}
            />
          </View>

          <Text style={styles.section}>NOTIFICATIONS</Text>

          <View style={styles.card}>
            <Row
              icon="notifications"
              title="Allow Notifications"
              toggle
              value={notify}
            />
          </View>

          <Text style={styles.section}>ACCOUNT & SYNC</Text>

          <View style={styles.card}>
            {user ? (
              <Row
                icon="person"
                title={user.username}
                subtitle={user.email}
                onPress={logout}
              />
            ) : (
              <Row
                icon="logo-google"
                title="Sign in"
                subtitle="Sync favorites across devices"
                onPress={signInGoogle}
              />
            )}
          </View>

          <Text style={styles.section}>ABOUT</Text>

          <View style={styles.card}>
            <Row
              icon="information-circle"
              title="FlexiWalls"
              subtitle="Version 1.0.0"
            />

            <Row icon="shield-checkmark" title="Privacy Policy" />
          </View>

          <Text style={styles.copy}>© 2026 FlexiWalls</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 25,
    padding: 25,
  },

  heading: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
  },

  premium: {
    margin: 25,
    padding: 30,
    borderRadius: 30,
  },

  premiumTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },

  premiumSub: {
    color: '#eee',
    fontSize: 16,
    marginVertical: 20,
  },

  start: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 30,
    width: 160,
    alignItems: 'center',
  },

  startText: {
    color: colors.accent,
    fontWeight: '900',
  },

  quick: {
    flexDirection: 'row',
    marginHorizontal: 25,
    gap: 15,
  },

  quickBtn: {
    flex: 1,
    height: 80,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickText: {
    color: '#fff',
    fontWeight: '800',
  },

  section: {
    marginTop: 35,
    marginLeft: 25,
    letterSpacing: 5,
    color: '#aaa',
    fontWeight: '900',
  },

  card: {
    margin: 25,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,.05)',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
    gap: 20,
  },

  iconBox: {
    height: 55,
    width: 55,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },

  sub: {
    color: '#aaa',
    marginTop: 5,
  },

  copy: {
    textAlign: 'center',
    color: '#888',
    marginBottom: 30,
  },
});
