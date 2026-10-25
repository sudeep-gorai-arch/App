import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';

/**
 * Run Google's UMP flow before requesting ads. Consent messages must also be
 * configured for FlexiWalls in AdMob Privacy & messaging.
 * Never load advertisements while consent cannot be established.
 */
export async function initializeAds(): Promise<boolean> {
  let canRequestAds = false;
  try {
    const consent = await AdsConsent.gatherConsent();
    canRequestAds = Boolean(consent.canRequestAds);
  } catch {
    // UMP may have valid consent from a previous session. Otherwise fail closed.
    try {
      const savedConsent = await AdsConsent.getConsentInfo();
      canRequestAds = Boolean(savedConsent.canRequestAds);
    } catch {
      canRequestAds = false;
    }
  }

  if (!canRequestAds) return false;
  await mobileAds().initialize();
  return true;
}
