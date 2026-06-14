import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import MeshBackground from '../../components/MeshBackground';
import Card from '../../components/Card';

import { colors, gradients } from '../../styles/colors';
import { spacing, radius, PROFILE } from '../../utils/constants';

import { getDownloads } from '../../services/downloadService';
import { Wallpaper } from '../../services/types';

type Nav = {
  navigate: (name: string) => void;
};

const USER = {
  name: 'Ethan Hunt',
  email: 'ethanhunt@email.com',
  tier: 'Premium',
  avatar: 'https://picsum.photos/seed/acct-ethan/400/400',
};

const OptionRow = ({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress?: () => void;
}) => (
  <Pressable style={styles.option} onPress={onPress}>
    <Ionicons name={icon} size={22} color={colors.textSecondary} />

    <Text style={styles.optionText}>{title}</Text>

    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
  </Pressable>
);

const ProfileScreen = ({ navigation }: { navigation: Nav }) => {
  const [downloads, setDownloads] = useState<string[]>(PROFILE.downloads);

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const res = await getDownloads();

      const imgs = (res?.data ?? [])
        .map((x: Wallpaper) => x.imageUrl ?? x.thumbnailUrl)
        .filter(Boolean) as string[];

      if (imgs.length) {
        setDownloads(imgs);
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
          }}
        >
          {/* PROFILE */}

          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={gradients.violetMagenta}
              style={styles.avatarRing}
            >
              <Image
                source={{
                  uri: USER.avatar,
                }}
                style={styles.avatar}
              />
            </LinearGradient>
          </View>

          <Text style={styles.name}>{USER.name}</Text>

          <Text style={styles.email}>{USER.email}</Text>

          <View style={styles.badge}>
            <MaterialCommunityIcons
              name="crown"
              size={15}
              color={colors.accent}
            />

            <Text style={styles.badgeText}>{USER.tier} Member</Text>
          </View>

          {/* EDIT PROFILE */}

          <Card style={styles.card} padding={0} strong>
            <OptionRow
              icon="create-outline"
              title="Edit Profile"
              onPress={() => navigation.navigate('EditProfile')}
            />
          </Card>

          {/* RECENT DOWNLOADS */}

          <Card style={styles.card} padding={spacing.lg} strong>
            <View style={styles.sectionHead}>
              <Text style={styles.title}>Recent Downloads</Text>

              <Pressable onPress={() => navigation.navigate('Downloads')}>
                <Text style={styles.view}>View All</Text>
              </Pressable>
            </View>

            <View style={styles.downloadRow}>
              {downloads

                .slice(0, 5)

                .map((img, index) => (
                  <Image
                    key={index}
                    source={{ uri: img }}
                    style={styles.thumb}
                  />
                ))}
            </View>
          </Card>

          {/* ACCOUNT SETTINGS */}

          <Card style={styles.card} padding={0} strong>
            <OptionRow
              icon="card-outline"
              title="Manage Subscription"
              onPress={() => navigation.navigate('Subscription')}
            />

            <OptionRow
              icon="shield-checkmark-outline"
              title="Privacy & Security"
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />

            <OptionRow
              icon="help-circle-outline"
              title="Help & Support"
              onPress={() => navigation.navigate('HelpSupport')}
            />

            <OptionRow
              icon="information-circle-outline"
              title="About"
              onPress={() => navigation.navigate('About')}
            />
          </Card>

          {/* LOGOUT */}

          <Pressable style={styles.logout}>
            <Ionicons name="log-out-outline" size={22} color="#FF5A6E" />

            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  avatarWrap: {
    alignSelf: 'center',
    marginTop: 30,
  },

  avatarRing: {
    width: 130,

    height: 130,

    borderRadius: 65,

    padding: 5,
  },

  avatar: {
    width: '100%',

    height: '100%',

    borderRadius: 60,
  },

  name: {
    color: colors.textPrimary,

    fontSize: 28,

    fontWeight: '800',

    textAlign: 'center',

    marginTop: 20,
  },

  email: {
    color: colors.textSecondary,

    textAlign: 'center',

    marginTop: 5,
  },

  badge: {
    flexDirection: 'row',

    alignSelf: 'center',

    gap: 6,

    marginTop: 10,
  },

  badgeText: {
    color: colors.accent,

    fontWeight: '700',
  },

  card: {
    marginHorizontal: spacing.xl,

    marginTop: spacing.xl,
  },

  option: {
    flexDirection: 'row',

    alignItems: 'center',

    padding: 18,

    gap: 15,
  },

  optionText: {
    flex: 1,

    color: colors.textPrimary,

    fontSize: 16,

    fontWeight: '600',
  },

  sectionHead: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    marginBottom: 15,
  },

  title: {
    color: colors.textPrimary,

    fontSize: 18,

    fontWeight: '800',
  },

  view: {
    color: colors.accent,

    fontWeight: '700',
  },

  downloadRow: {
    flexDirection: 'row',

    gap: 10,
  },

  thumb: {
    flex: 1,

    aspectRatio: 0.75,

    borderRadius: 12,
  },

  logout: {
    margin: spacing.xl,

    padding: 18,

    borderRadius: radius.lg,

    flexDirection: 'row',

    justifyContent: 'center',

    gap: 10,

    borderWidth: 1,

    borderColor: '#FF5A6E',
  },

  logoutText: {
    color: '#FF5A6E',

    fontSize: 17,

    fontWeight: '800',
  },
});
