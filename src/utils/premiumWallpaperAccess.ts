import { useCallback } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import type { PremiumReturnRoute } from '../navigation/RootStackParamList';

export const isPremiumWallpaper = (wallpaper: any): boolean => {
  return Boolean(
    wallpaper?.isPremium === true ||
      wallpaper?.is_premium === true ||
      wallpaper?.premium === true ||
      wallpaper?.premiumOnly === true ||
      wallpaper?.premiumLocked === true,
  );
};

export const isPremiumUserActive = (user: any): boolean => {
  if (!user) return false;

  const premiumUntilValue =
    user.premiumUntil ||
    user.premium_until ||
    user.subscription?.premiumUntil ||
    user.subscription?.premium_until ||
    user.subscription?.endDate ||
    user.subscription?.end_date;

  const premiumUntilTime = premiumUntilValue
    ? new Date(premiumUntilValue).getTime()
    : 0;

  const hasActivePremiumDate =
    Number.isFinite(premiumUntilTime) && premiumUntilTime > Date.now();

  const premiumFlag = Boolean(
    user.isPremium === true ||
      user.is_premium === true ||
      user.premium === true ||
      user.premiumActive === true ||
      user.subscription?.active === true ||
      user.subscription?.isPremium === true ||
      user.subscription?.is_premium === true,
  );

  if (premiumUntilValue) {
    return premiumFlag && hasActivePremiumDate;
  }

  // Backward compatibility for older profiles that expose only isPremium.
  return premiumFlag;
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

export const redirectToPremiumForWallpaper = ({
  navigation,
  wallpaper,
  user,
  returnTo,
}: {
  navigation: any;
  wallpaper: any;
  user: any;
  returnTo: PremiumReturnRoute;
}): boolean => {
  if (!isPremiumWallpaper(wallpaper) || isPremiumUserActive(user)) {
    return false;
  }

  const rootNavigation = getRootNavigation(navigation);

  rootNavigation.dispatch(
    CommonActions.navigate({
      name: 'Premium',
      params: { returnTo },
    }),
  );

  return true;
};

export const usePremiumWallpaperGuard = (
  returnTo: PremiumReturnRoute,
): ((wallpaper: any) => boolean) => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  return useCallback(
    (wallpaper: any) => {
      return !redirectToPremiumForWallpaper({
        navigation,
        wallpaper,
        user,
        returnTo,
      });
    },
    [navigation, returnTo, user],
  );
};