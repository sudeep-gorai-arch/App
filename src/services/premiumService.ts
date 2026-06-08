
export const canDownloadPremium=(user:any,wallpaper:any)=>{
 if(!wallpaper.isPremium) return true;
 return user?.isPremium===true;
}
