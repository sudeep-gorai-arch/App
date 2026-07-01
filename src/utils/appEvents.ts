import { useEffect } from 'react';

export type AppEventName =
  | 'favoritesChanged'
  | 'downloadsChanged'
  | 'premiumChanged'
  | 'wallpapersChanged'
  | 'wallpaperChanged';

export type FavoriteChangedPayload = {
  wallpaperId: string;
  isFavorite: boolean;
  favoriteCount?: number;
  wallpaper?: any;
};

export type DownloadChangedPayload = {
  wallpaperId: string;
  downloadCount?: number;
  wallpaper?: any;
};

export type PremiumChangedPayload = {
  isPremium?: boolean;
  user?: any;
};

export type WallpaperChangedPayload = {
  wallpaperId?: string;
  wallpaper?: any;
};

export type AppEventPayloadMap = {
  favoritesChanged: FavoriteChangedPayload;
  downloadsChanged: DownloadChangedPayload;
  premiumChanged: PremiumChangedPayload;
  wallpapersChanged: WallpaperChangedPayload;
  wallpaperChanged: WallpaperChangedPayload;
};

type AppEventPayload<T extends AppEventName> = AppEventPayloadMap[T];

type AppEventListener<T extends AppEventName> = (
  payload: AppEventPayload<T>,
) => void;

const listeners: {
  [K in AppEventName]?: Set<AppEventListener<K>>;
} = {};

export const appEvents = {
  on<T extends AppEventName>(
    eventName: T,
    listener: AppEventListener<T>,
  ) {
    if (!listeners[eventName]) {
      listeners[eventName] = new Set() as any;
    }

    (listeners[eventName] as Set<AppEventListener<T>>).add(listener);

    return () => {
      (listeners[eventName] as Set<AppEventListener<T>> | undefined)?.delete(
        listener,
      );
    };
  },

  emit<T extends AppEventName>(
    eventName: T,
    payload: AppEventPayload<T>,
  ) {
    const eventListeners = listeners[eventName] as
      | Set<AppEventListener<T>>
      | undefined;

    if (!eventListeners?.size) {
      return;
    }

    eventListeners.forEach(listener => {
      try {
        listener(payload);
      } catch (error) {
        console.log(`APP EVENT ERROR: ${eventName}`, error);
      }
    });
  },

  clear(eventName?: AppEventName) {
    if (eventName) {
      listeners[eventName]?.clear();
      return;
    }

    Object.values(listeners).forEach(listenerSet => {
      listenerSet?.clear();
    });
  },
};

export const useAppEvent = <T extends AppEventName>(
  eventName: T,
  listener: AppEventListener<T>,
) => {
  useEffect(() => {
    const unsubscribe = appEvents.on(eventName, listener);

    return unsubscribe;
  }, [eventName, listener]);
};