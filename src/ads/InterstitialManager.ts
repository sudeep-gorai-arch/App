import {InterstitialAd,AdEventType,TestIds} from 'react-native-google-mobile-ads';
import {AdIds} from './AdIds';

class InterstitialManager{
  private ad=InterstitialAd.createForAdRequest(AdIds.interstitial);
  private loaded=false;

  constructor(){
    this.ad.addAdEventListener(AdEventType.LOADED,()=>this.loaded=true);
    this.ad.addAdEventListener(AdEventType.CLOSED,()=>{
      this.loaded=false;
      this.load();
    });
  }

  load(){this.ad.load();}
  show(){
    if(this.loaded){
      this.ad.show();
      return true;
    }
    this.load();
    return false;
  }
}

export default new InterstitialManager();
