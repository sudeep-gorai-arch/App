import API from './api';

export const getFavorites=()=>API.get('/favorites?limit=20&offset=0').then(r=>r.data);
export const addFavorite=(wallpaperId:string)=>API.post('/favorites',{wallpaperId}).then(r=>r.data);
export const removeFavorite=(wallpaperId:string)=>API.delete(`/favorites/${wallpaperId}`).then(r=>r.data);
