import { create } from 'zustand';


type User = {
    id: string;
    username: string;
    avatarUrl?: string;
    isPremium: boolean;
};


type AuthStore = {

    user: User | null;

    token: string | null;


    login: (user: User, token: string) => void;

    logout: () => void;

};


export const useAuth =
    create<AuthStore>((set) => ({

        user: null,

        token: null,


        login: (user, token) =>
            set({
                user,
                token
            }),


        logout: () => set({
            user: null,
            token: null
        })

    }));