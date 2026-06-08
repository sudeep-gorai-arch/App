import API from './api';
import {Wallpaper,ApiResponse} from './types';

export const getWallpapers=(limit=10,offset=0,search='',category='')=>
 API.get<ApiResponse<Wallpaper[]>>('/wallpapers',{params:{limit,offset,search,category}}).then(r=>r.data);

export const getFeaturedWallpapers=()=>
 API.get<ApiResponse<Wallpaper[]>>('/wallpapers/featured?limit=5').then(r=>r.data);

export const getTrendingWallpapers=()=>
 API.get<ApiResponse<Wallpaper[]>>('/wallpapers/trending?limit=10').then(r=>r.data);

export const getWallpaperById=(id:string)=>
 API.get<ApiResponse<Wallpaper>>(`/wallpapers/${id}`).then(r=>r.data);
