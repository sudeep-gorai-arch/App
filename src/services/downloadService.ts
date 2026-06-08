
import api from './api';

export const addDownload=(wallpaperId:string)=>
 api.post('/downloads',{wallpaperId});

export const getDownloads=()=>
 api.get('/downloads');
