import React, { useEffect, useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Share,
  Alert,
  ActivityIndicator,
  Image,
  ImageStyle,
  Modal,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

import MeshBackground from "../../components/MeshBackground";

import Card from "../../components/Card";

import { colors } from "../../styles/colors";

import { spacing, radius } from "../../utils/constants";

import { useAuth } from "../../context/AuthContext";

import API from "../../services/api";

import { preferencesService } from "../../services/preferencesService";

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  toggle?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
};

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress?: () => void;
};

type DeleteModalType = "login" | "first" | "final" | "success" | "error" | null;

type WarningModalVariant = "info" | "warning" | "danger" | "success" | "error";

type WarningModalProps = {
  visible: boolean;
  variant: WarningModalVariant;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  bullets?: string[];
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  loading?: boolean;
  primaryDanger?: boolean;
};

const DANGER = "#FF5A6E";

const Row = ({
  icon,
  title,
  subtitle,
  onPress,
  danger,
  toggle,
  value,
  onValueChange,
  disabled,
}: RowProps) => {
  return (
    <Pressable
      disabled={disabled || toggle}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && !toggle ? styles.rowPressed : null,
        disabled ? styles.disabledRow : null,
      ]}
    >
      <View style={[styles.iconBox, danger && styles.dangerIconBox]}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? DANGER : colors.accent}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>
          {title}
        </Text>

        {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>

      {toggle ? (
        <Switch
          disabled={disabled}
          value={!!value}
          onValueChange={onValueChange}
          trackColor={{
            false: "rgba(255,255,255,.16)",
            true: "rgba(167,139,250,.5)",
          }}
          thumbColor={value ? colors.accent : "#E5E7EB"}
        />
      ) : (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      )}
    </Pressable>
  );
};

const QuickAction = ({ icon, title, onPress }: QuickActionProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.quickAction,
      pressed ? styles.quickActionPressed : null,
    ]}
  >
    <View style={styles.quickIcon}>
      <Ionicons name={icon} size={24} color={colors.accent} />
    </View>

    <Text style={styles.quickTitle}>{title}</Text>
  </Pressable>
);

const getModalAccent = (variant: WarningModalVariant) => {
  if (variant === "success") return "#34D399";
  if (variant === "warning") return "#FBBF24";
  if (variant === "info") return colors.accent;

  return DANGER;
};

const WarningModal = ({
  visible,
  variant,
  icon,
  title,
  message,
  bullets,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  loading,
  primaryDanger,
}: WarningModalProps) => {
  const accent = getModalAccent(variant);

  const closeModal = () => {
    if (!loading && onSecondary) {
      onSecondary();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <View style={styles.modalBackdrop}>
        <Pressable
          disabled={loading || !onSecondary}
          style={styles.modalBackdropPressable}
          onPress={closeModal}
        />

        <View style={styles.modalOuterGlow}>
          <LinearGradient
            colors={[
              "rgba(139,92,246,.34)",
              "rgba(236,72,153,.18)",
              "rgba(15,15,16,.98)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalCard}
          >
            <View style={[styles.modalIconWrap, { borderColor: accent }]}>
              <View
                style={[
                  styles.modalIconInner,
                  { backgroundColor: `${accent}20` },
                ]}
              >
                <Ionicons name={icon} size={34} color={accent} />
              </View>
            </View>

            <Text style={styles.modalTitle}>{title}</Text>

            <Text style={styles.modalMessage}>{message}</Text>

            {!!bullets?.length && (
              <View style={styles.modalBulletBox}>
                {bullets.map((item) => (
                  <View key={item} style={styles.modalBulletRow}>
                    <View
                      style={[
                        styles.modalBulletDot,
                        { backgroundColor: accent },
                      ]}
                    />

                    <Text style={styles.modalBulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.modalActions}>
              {!!secondaryLabel && (
                <Pressable
                  disabled={loading}
                  onPress={onSecondary}
                  style={({ pressed }) => [
                    styles.modalSecondaryButton,
                    pressed ? styles.modalButtonPressed : null,
                    loading ? styles.disabledRow : null,
                  ]}
                >
                  <Text style={styles.modalSecondaryText}>
                    {secondaryLabel}
                  </Text>
                </Pressable>
              )}

              <Pressable
                disabled={loading}
                onPress={onPrimary}
                style={({ pressed }) => [
                  styles.modalPrimaryButtonWrap,
                  !secondaryLabel ? styles.modalPrimaryButtonFull : null,
                  pressed ? styles.modalButtonPressed : null,
                  loading ? styles.disabledRow : null,
                ]}
              >
                <LinearGradient
                  colors={
                    primaryDanger
                      ? ["#FF5A6E", "#B91C1C"]
                      : ["#A78BFA", "#EC4899"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalPrimaryButton}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalPrimaryText}>{primaryLabel}</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

export default function SettingsScreen({ navigation }: any) {
  const { user, signInGoogle, logout, authLoading } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [wifiOnlyDownloads, setWifiOnlyDownloads] = useState(true);

  const [preferencesLoading, setPreferencesLoading] = useState(true);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const [deleteModalType, setDeleteModalType] = useState<DeleteModalType>(null);

  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        const [savedNotifications, savedWifiOnlyDownloads] = await Promise.all([
          preferencesService.getNotificationsEnabled(),
          preferencesService.getWifiOnlyDownloads(),
        ]);

        if (!isMounted) return;

        setNotificationsEnabled(savedNotifications);
        setWifiOnlyDownloads(savedWifiOnlyDownloads);
      } catch (error) {
        console.log("LOAD PREFERENCES ERROR", error);
      } finally {
        if (isMounted) {
          setPreferencesLoading(false);
        }
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const avatarUrl = useMemo(() => {
    if (!user) return null;

    return (
      user.avatarUrl ||
      `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(
        user.username || user.email || "FlexiWalls",
      )}`
    );
  }, [user]);

  const memberLabel = user?.isPremium ? "Premium Member" : "Free Member";

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.("MainTabs");
  };

  const openPremium = () => {
    if (user?.isPremium) {
      navigation.navigate("Subscription");
      return;
    }

    navigation.navigate("Premium");
  };

  const shareApp = async () => {
    try {
      await Share.share({
        message:
          "Try FlexiWalls — premium wallpapers crafted for every screen. Use this link to download the app - https://expo.dev/artifacts/eas/V3mHQ8w65IxUlSv4Llt5GSNzSCAHcd-T_hWUFqtg_c8.apk",
      });
    } catch (error) {
      console.log("SHARE ERROR", error);
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    try {
      setNotificationsEnabled(enabled);

      const result = await preferencesService.setNotificationsEnabled(enabled);

      if (!result.granted && enabled) {
        setNotificationsEnabled(false);

        Alert.alert(
          "Permission needed",
          "Notification permission was not granted. Please allow notifications from your phone settings.",
        );

        return;
      }

      setNotificationsEnabled(result.enabled);
    } catch (error) {
      console.log("NOTIFICATION TOGGLE ERROR", error);

      setNotificationsEnabled(false);

      Alert.alert(
        "Notification error",
        "Unable to update notification preference. Please try again.",
      );
    }
  };

  const handleWifiOnlyDownloadsToggle = async (enabled: boolean) => {
    try {
      setWifiOnlyDownloads(enabled);

      await preferencesService.setWifiOnlyDownloads(enabled);
    } catch (error) {
      console.log("WIFI ONLY TOGGLE ERROR", error);

      setWifiOnlyDownloads(!enabled);

      Alert.alert(
        "Preference error",
        "Unable to update Wi-Fi only downloads setting. Please try again.",
      );
    }
  };

  const handleLogout = () => {
    if (!user) return;

    Alert.alert("Logout", "Are you sure you want to logout from this device?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();

            navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs" }],
            });
          } catch (error) {
            console.log("LOGOUT ERROR", error);

            Alert.alert(
              "Logout failed",
              "Something went wrong while logging out. Please try again.",
            );
          }
        },
      },
    ]);
  };

  const closeDeleteModal = () => {
    if (!deleteLoading) {
      setDeleteModalType(null);
    }
  };

  const handleDeleteAccount = () => {
    if (!user) {
      setDeleteModalType("login");
      return;
    }

    setDeleteModalType("first");
  };

  const deleteAccount = async () => {
    try {
      setDeleteLoading(true);

      await API.delete("/users/me");

      await logout();

      setDeleteModalType("success");
    } catch (error: any) {
      console.log("DELETE ACCOUNT ERROR", error?.response?.data || error);

      const status = error?.response?.status;

      setDeleteErrorMessage(
        status === 404
          ? "Delete account API is not available yet. Please add DELETE /api/users/me in the backend."
          : "Something went wrong while deleting your account. Please try again.",
      );

      setDeleteModalType("error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const completeDeletedFlow = () => {
    setDeleteModalType(null);

    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="profile" />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={goBack}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Settings</Text>

              <Text style={styles.headerSubtitle}>
                Manage your preferences and account actions.
              </Text>
            </View>
          </View>

          <Card style={styles.profileCard} padding={0} strong glowBorder>
            <LinearGradient
              colors={[
                "rgba(139,92,246,.28)",
                "rgba(236,72,153,.14)",
                "rgba(15,15,16,.25)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradient}
            >
              {user ? (
                <>
                  <View style={styles.avatarRing}>
                    <Image
                      source={{ uri: avatarUrl || "" }}
                      style={styles.avatar as ImageStyle}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{user.username}</Text>

                    <Text style={styles.profileEmail}>{user.email}</Text>

                    <View style={styles.memberBadge}>
                      <Ionicons
                        name={user.isPremium ? "diamond" : "person"}
                        size={14}
                        color={user.isPremium ? "#FFD54F" : colors.accent}
                      />

                      <Text style={styles.memberText}>{memberLabel}</Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.guestAvatar}>
                    <Ionicons name="person" size={38} color="#fff" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>Guest User</Text>

                    <Text style={styles.profileEmail}>
                      Sign in to sync favorites and downloads.
                    </Text>

                    <Pressable
                      disabled={authLoading}
                      style={styles.signInButton}
                      onPress={signInGoogle}
                    >
                      {authLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="logo-google" size={18} color="#fff" />

                          <Text style={styles.signInText}>
                            Continue with Google
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </>
              )}
            </LinearGradient>
          </Card>

          <View style={styles.quickGrid}>
            <QuickAction
              icon="diamond-outline"
              title={user?.isPremium ? "Manage Premium" : "Get Premium"}
              onPress={openPremium}
            />

            <QuickAction
              icon="share-social-outline"
              title="Share App"
              onPress={shareApp}
            />
          </View>

          <Text style={styles.sectionTitle}>PREFERENCES</Text>

          <Card style={styles.card} padding={0} strong>
            <Row
              icon="notifications-outline"
              title="Notifications"
              subtitle="Wallpaper updates and premium offers"
              toggle
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              disabled={preferencesLoading}
            />

            <View style={styles.divider} />

            <Row
              icon="cellular-outline"
              title="Wi-Fi Only Downloads"
              subtitle="Avoid mobile data usage for downloads"
              toggle
              value={wifiOnlyDownloads}
              onValueChange={handleWifiOnlyDownloadsToggle}
              disabled={preferencesLoading}
            />
          </Card>

          <Text style={styles.sectionTitle}>ACCOUNT ACTIONS</Text>

          <Card style={styles.card} padding={0} strong>
            {user ? (
              <>
                <Row
                  icon="log-out-outline"
                  title="Logout"
                  subtitle="Sign out from this device"
                  onPress={handleLogout}
                />

                <View style={styles.divider} />

                <Row
                  icon="trash-outline"
                  title={
                    deleteLoading
                      ? "Deleting account..."
                      : "Delete Account and Data"
                  }
                  subtitle="Permanently remove your account and saved data"
                  danger
                  disabled={deleteLoading}
                  onPress={handleDeleteAccount}
                />
              </>
            ) : (
              <Row
                icon="lock-closed-outline"
                title="Account actions locked"
                subtitle="Sign in to logout or delete your account."
                onPress={signInGoogle}
              />
            )}
          </Card>

          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={colors.textSecondary}
            />

            <Text style={styles.footerText}>
              Your privacy and account control stay with you.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <WarningModal
        visible={deleteModalType === "login"}
        variant="info"
        icon="lock-closed-outline"
        title="Login required"
        message="Please sign in first to delete your FlexiWalls account and saved data."
        primaryLabel="Continue with Google"
        secondaryLabel="Maybe later"
        onPrimary={() => {
          setDeleteModalType(null);
          signInGoogle();
        }}
        onSecondary={closeDeleteModal}
      />

      <WarningModal
        visible={deleteModalType === "first"}
        variant="warning"
        icon="warning-outline"
        title="Delete account and data?"
        message="Before you continue, please review what will be removed from FlexiWalls."
        bullets={[
          "Your account profile and login data",
          "Your favorites, likes and download history",
          "Your premium profile status stored in the app",
        ]}
        primaryLabel="Continue"
        secondaryLabel="Keep account"
        onPrimary={() => setDeleteModalType("final")}
        onSecondary={closeDeleteModal}
      />

      <WarningModal
        visible={deleteModalType === "final"}
        variant="danger"
        icon="trash-outline"
        title="Final confirmation"
        message="This action is permanent. Once deleted, your FlexiWalls account and saved data cannot be restored."
        primaryLabel="Delete permanently"
        secondaryLabel="Cancel"
        onPrimary={deleteAccount}
        onSecondary={closeDeleteModal}
        loading={deleteLoading}
        primaryDanger
      />

      <WarningModal
        visible={deleteModalType === "success"}
        variant="success"
        icon="checkmark-circle-outline"
        title="Account deleted"
        message="Your account and saved data have been deleted successfully."
        primaryLabel="Done"
        onPrimary={completeDeletedFlow}
      />

      <WarningModal
        visible={deleteModalType === "error"}
        variant="error"
        icon="close-circle-outline"
        title="Delete failed"
        message={deleteErrorMessage}
        primaryLabel="Okay"
        onPrimary={closeDeleteModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.base,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.1)",
  },

  headerTitle: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },

  profileCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },

  profileGradient: {
    minHeight: 150,
    padding: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: radius.lg,
  },

  avatarRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    padding: 3,
    backgroundColor: "rgba(255,255,255,.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.22)",
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
    backgroundColor: colors.glassFillSoft,
  },

  guestAvatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(255,255,255,.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.16)",
  },

  profileName: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "900",
  },

  profileEmail: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 5,
  },

  memberBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.12)",
  },

  memberText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },

  signInButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.16)",
  },

  signInText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },

  quickGrid: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    flexDirection: "row",
    gap: spacing.md,
  },

  quickAction: {
    flex: 1,
    minHeight: 106,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.09)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },

  quickActionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "rgba(167,139,250,.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },

  quickTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  sectionTitle: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 3,
  },

  card: {
    marginHorizontal: spacing.xl,
  },

  row: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  rowPressed: {
    backgroundColor: "rgba(255,255,255,.035)",
  },

  disabledRow: {
    opacity: 0.6,
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "rgba(167,139,250,.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  dangerIconBox: {
    backgroundColor: "rgba(255,90,110,.1)",
  },

  rowTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },

  dangerText: {
    color: DANGER,
  },

  rowSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 82,
    backgroundColor: colors.divider,
  },

  footer: {
    marginTop: spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.xl,
  },

  footerText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },

  modalBackdropPressable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  modalOuterGlow: {
    width: "100%",
    borderRadius: 30,
    padding: 1,
    backgroundColor: "rgba(255,255,255,.12)",
    shadowColor: "#A78BFA",
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 18,
  },

  modalCard: {
    borderRadius: 30,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.13)",
    overflow: "hidden",
  },

  modalIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,.08)",
    marginBottom: spacing.lg,
  },

  modalIconInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.2,
  },

  modalMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  modalBulletBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.09)",
    gap: 11,
  },

  modalBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },

  modalBulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
  },

  modalBulletText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },

  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  modalSecondaryButton: {
    flex: 1,
    height: 54,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.12)",
  },

  modalSecondaryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  modalPrimaryButtonWrap: {
    flex: 1,
    height: 54,
    borderRadius: radius.pill,
    overflow: "hidden",
  },

  modalPrimaryButtonFull: {
    flex: 0,
    width: "100%",
  },

  modalPrimaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },

  modalPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },

  modalButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
});