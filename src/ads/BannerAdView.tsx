import React from 'react';
import {BannerAd,BannerAdSize} from 'react-native-google-mobile-ads';

type Props={unitId:string};

export default function BannerAdView({unitId}:Props){
  return(
    <BannerAd
      unitId={unitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
    />
  );
}
