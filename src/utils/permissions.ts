import { ensureDeviceMediaPermission } from '../services/deviceMediaService';

// Use the same app-owned-download permission flow as the download coordinator.
export const requestGalleryPermission = () => ensureDeviceMediaPermission('image');
