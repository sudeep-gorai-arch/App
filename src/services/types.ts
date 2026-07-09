export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

/* ===========================
   AUTH
=========================== */

export interface Role {
    id: string;
    name: string;
}

export interface User {
    id: string;

    username: string;

    email: string;

    avatarUrl?: string | null;

    bio?: string | null;

    isPremium: boolean;

    role?: Role | null;

    createdAt?: string;

    updatedAt?: string;
}

export interface AuthRequest {
    email: string;
    password: string;
    username?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

/* ===========================
   CATEGORY
=========================== */

export interface Category {
    id: string;

    name: string;

    slug: string;

    thumbnailUrl?: string | null;

    active?: boolean;

    sortOrder?: number;

    wallpaperCount?: number;

    count?: number;

    createdAt?: string;

    updatedAt?: string;
}

/* ===========================
   WALLPAPER
=========================== */

export type WallpaperMediaType = "IMAGE" | "VIDEO";

export interface Wallpaper {
    id: string;

    title: string;

    subtitle?: string | null;

    description?: string | null;

    slug?: string;

    mediaType?: WallpaperMediaType | string;

    isVideo?: boolean;

    imageUrl: string;

    thumbnailUrl?: string | null;

    downloadUrl?: string | null;

    videoUrl?: string | null;

    videoPreviewUrl?: string | null;

    videoThumbnailUrl?: string | null;

    durationSeconds?: number | null;

    videoBitrate?: number | null;

    videoFps?: number | null;

    videoSize?: number | null;

    mimeType?: string | null;

    extension?: string | null;

    quality: string;

    resolution?: string;

    width?: number | null;

    height?: number | null;

    active?: boolean;

    isFeatured: boolean;

    isPremium: boolean;

    likes: number;

    likeCount?: number;

    downloadCount: number;

    downloads?: number;

    downloadsThisWeek?: number;

    weeklyDownloads?: number;

    viewCount?: number;

    views?: number;

    createdAt: string;

    updatedAt: string;

    categoryId?: string;

    category?: Category | null;

    isLiked?: boolean;

    isFavorite?: boolean;
}

/* ===========================
   FAVORITE
=========================== */

export interface Favorite {
    id: string;

    wallpaperId: string;

    wallpaper: Wallpaper;

    createdAt: string;
}

/* ===========================
   DOWNLOAD
=========================== */

export interface Download {
    id: string;

    wallpaperId: string;

    wallpaper?: Wallpaper;

    mediaType?: WallpaperMediaType | string;

    isVideo?: boolean;

    downloadUrl?: string | null;

    imageUrl?: string | null;

    thumbnailUrl?: string | null;

    videoUrl?: string | null;

    videoPreviewUrl?: string | null;

    videoThumbnailUrl?: string | null;

    durationSeconds?: number | null;

    videoSize?: number | null;

    mimeType?: string | null;

    extension?: string | null;

    quality: string;

    isPremium?: boolean;

    downloadCount?: number;

    favoriteCount?: number;

    createdAt: string;
}