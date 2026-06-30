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

    createdAt?: string;

    updatedAt?: string;
}

/* ===========================
   WALLPAPER
=========================== */

export interface Wallpaper {
    id: string;

    title: string;

    subtitle?: string | null;

    description?: string | null;

    slug?: string;

    imageUrl: string;

    thumbnailUrl?: string | null;

    videoUrl?: string | null;

    quality: string;

    resolution?: string;

    active?: boolean;

    isFeatured: boolean;

    isPremium: boolean;

    likes: number;

    downloadCount: number;

    viewCount?: number;

    createdAt: string;

    updatedAt: string;

    categoryId?: string;

    category?: Category;

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

    wallpaper: Wallpaper;

    quality: string;

    createdAt: string;
}