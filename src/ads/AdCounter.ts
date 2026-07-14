let count=0;
export function shouldShowInterstitial(limit=5){
  count++;
  return count%limit===0;
}
export function resetCounter(){count=0;}
