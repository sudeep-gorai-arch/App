import {RewardedAd,RewardedAdEventType} from 'react-native-google-mobile-ads';
import {AdIds} from './AdIds';

class RewardedManager{
  private ad=RewardedAd.createForAdRequest(AdIds.rewarded);
  private loaded=false;
  private callback:(()=>void)|null=null;

  constructor(){
    this.ad.addAdEventListener(RewardedAdEventType.LOADED,()=>this.loaded=true);
    this.ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD,()=>{
      this.callback?.();
    });
    this.ad.addAdEventListener(RewardedAdEventType.CLOSED,()=>{
      this.loaded=false;
      this.load();
    });
  }

  load(){this.ad.load();}

  show(onReward:()=>void){
    this.callback=onReward;
    if(this.loaded){
      this.ad.show();
      return true;
    }
    this.load();
    return false;
  }
}

export default new RewardedManager();
