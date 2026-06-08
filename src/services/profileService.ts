import API from './api';
export const getProfile=()=>API.get('/users/me').then(r=>r.data);
