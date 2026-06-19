import api from './api';


// Auth user download
export const addDownload = (
    wallpaperId: string
) =>
    api.post(
        '/downloads',
        {
            wallpaperId,
        }
    );



// Public / Guest download
export const addPublicDownload = (
    wallpaperId: string
) =>
    api.post(
        '/downloads/public',
        {
            wallpaperId,
        }
    );



// User download history
export const getDownloads = () =>
    api.get(
        '/downloads'
    );