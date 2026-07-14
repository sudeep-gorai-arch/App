import mobileAds from 'react-native-google-mobile-ads';
export async function initializeAds(){
  await mobileAds().initialize();
}
