export interface ApiResponse<T> {

    success: boolean;

    data: T;

    message?: string;

}



// USER

export interface User {

    id: string;

    email: string;

    username: string;

}



export interface AuthRequest {

    email: string;

    password: string;

    username?: string;

}



export interface AuthResponse {

    user: User;

    token: string;

}



export interface Category {

    id: string;

    name: string;

    slug: string;

    count?: number;


    imageUrl?: string;


    icon?: string;

}



// WALLPAPER

export interface Wallpaper {

    id: string;


    title: string;


    subtitle?: string;


    imageUrl?: string;


    thumbnailUrl?: string;


    quality?: string;


    category?: Category;


    likes?: number;


    downloads?: number;


    isFeatured?: boolean;


    createdAt?: string;


    updatedAt?: string;

}



// FAVORITE

export interface Favorite {

    id: string;

    wallpaper: Wallpaper;

}



// DOWNLOAD

export interface Download {

    id: string;

    wallpaper: Wallpaper;

    createdAt: string;

}