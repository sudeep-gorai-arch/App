import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN = {
  width,
  height,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
} as const;

export const blur = {
  card: 32,
  panel: 45,
  nav: 55,
} as const;

const img = (seed: string, w = 800, h = 1200) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const HERO_SLIDES = [
  {
    id: 'hero-1',
    tag: 'WILDLIFE',
    title: 'Majestic Lion',
    subtitle: 'Cinematic moment of king of the jungle.',
    likes: '12.5K',
    quality: '8K',
    image: img('wx-lion', 1000, 1300),
  },
  {
    id: 'hero-2',
    tag: 'NATURE',
    title: 'Alpine Mirror',
    subtitle: 'Still water beneath endless peaks.',
    likes: '9.8K',
    quality: '8K',
    image: img('wx-alps', 1000, 1300),
  },
  {
    id: 'hero-3',
    tag: 'CITY',
    title: 'Neon Avenue',
    subtitle: 'Rain-soaked streets after midnight.',
    likes: '11.2K',
    quality: '8K',
    image: img('wx-neon', 1000, 1300),
  },
  {
    id: 'hero-4',
    tag: 'SPACE',
    title: 'Deep Field',
    subtitle: 'A quiet drift through the cosmos.',
    likes: '7.4K',
    quality: '8K',
    image: img('wx-space', 1000, 1300),
  },
  {
    id: 'hero-5',
    tag: 'ABSTRACT',
    title: 'Liquid Aura',
    subtitle: 'Colour folding into colour.',
    likes: '6.1K',
    quality: '8K',
    image: img('wx-aura', 1000, 1300),
  },
];

export const TRENDING = [
  { id: 't1', likes: '8.7K', quality: '8K', image: img('wx-sakura', 600, 900) },
  { id: 't2', likes: '7.1K', quality: '8K', image: img('wx-turtle', 600, 900) },
  { id: 't3', likes: '6.4K', quality: '8K', image: img('wx-citynight', 600, 900) },
  { id: 't4', likes: '5.9K', quality: '8K', image: img('wx-meadow', 600, 900) },
  { id: 't5', likes: '5.2K', quality: '8K', image: img('wx-desert', 600, 900) },
  { id: 't6', likes: '4.8K', quality: '8K', image: img('wx-aurora', 600, 900) },
];

export const CATEGORY_FILTERS = ['All', 'Popular', 'New', 'Premium'];

export const CATEGORIES = [
  {
    id: 'c1',
    name: 'Anime',
    count: '12,458',
    icon: 'happy-outline',
    image: img('wx-anime', 600, 400),
  },
  {
    id: 'c2',
    name: 'Sports',
    count: '8,746',
    icon: 'football-outline',
    image: img('wx-sports', 600, 400),
  },
  {
    id: 'c3',
    name: 'Nature',
    count: '15,231',
    icon: 'leaf-outline',
    image: img('wx-nature', 600, 400),
  },
  {
    id: 'c4',
    name: 'Cars',
    count: '9,876',
    icon: 'car-sport-outline',
    image: img('wx-cars', 600, 400),
  },
  {
    id: 'c5',
    name: 'Abstract',
    count: '11,098',
    icon: 'color-palette-outline',
    image: img('wx-abstract', 600, 400),
  },
  {
    id: 'c6',
    name: 'City',
    count: '7,654',
    icon: 'business-outline',
    image: img('wx-city', 600, 400),
  },
  {
    id: 'c7',
    name: 'Space',
    count: '7,432',
    icon: 'planet-outline',
    image: img('wx-galaxy', 600, 400),
  },
  {
    id: 'c8',
    name: 'Gaming',
    count: '8,654',
    icon: 'game-controller-outline',
    image: img('wx-gaming', 600, 400),
  },
  {
    id: 'c9',
    name: 'Animals',
    count: '6,789',
    icon: 'paw-outline',
    image: img('wx-animals', 600, 400),
  },
];

export const PROFILE = {
  name: 'Sudeep Gorai',
  badge: 'Premium',
  bio: 'Wallpaper lover and explorer ✨',
  avatar: img('wx-avatar', 400, 400),
  stats: [
    { id: 's1', label: 'Favorites', value: '1,248', icon: 'image-outline' },
    { id: 's2', label: 'Downloads', value: '342', icon: 'download-outline' },
    { id: 's3', label: 'Collections', value: '28', icon: 'heart-outline' },
  ],
  favorites: [
    img('wx-fav1', 300, 300),
    img('wx-fav2', 300, 300),
    img('wx-fav3', 300, 300),
    img('wx-fav4', 300, 300),
    img('wx-fav5', 300, 300),
  ],
  downloads: [
    img('wx-dl1', 300, 300),
    img('wx-dl2', 300, 300),
    img('wx-dl3', 300, 300),
    img('wx-dl4', 300, 300),
    img('wx-dl5', 300, 300),
  ],
  settings: [
    { id: 'g1', label: 'Account Settings', icon: 'person-outline' },
    { id: 'g2', label: 'Notifications', icon: 'notifications-outline' },
    { id: 'g3', label: 'Privacy Policy', icon: 'shield-checkmark-outline' },
    { id: 'g4', label: 'Help & Support', icon: 'help-circle-outline' },
    { id: 'g5', label: 'About FlexiWalls', icon: 'information-circle-outline' },
  ],
};

export const ABOUT = {
  appName: 'FlexiWalls',
  tagline: 'Redefining your screen, every day.',
  version: '1.0.1',
  versionStatus: 'Latest Version',
  developer: 'FlexiWalls',
  copyright: '© 2026 FlexiWalls. All rights reserved.',
  rows: [
    {
      id: 'a1',
      title: 'Terms of Service',
      subtitle: 'Read our terms and conditions',
      icon: 'document-text-outline',
    },
    {
      id: 'a2',
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      icon: 'shield-checkmark-outline',
    },
    {
      id: 'a3',
      title: 'Developer',
      subtitle: 'FlexiWalls',
      icon: 'code-slash-outline',
    },
    {
      id: 'a4',
      title: 'Support',
      subtitle: 'Contact us for any questions',
      icon: 'mail-outline',
    },
  ],
};

export const TAB_ITEMS = [
  {
    key: 'Home',
    label: 'Home',
    icon: 'home',
    routeName: 'Home',
  },

  {
    key: 'Category',
    label: 'Categories',
    icon: 'grid',
    routeName: 'Category',
  },

  {
    key: 'Trending',
    label: 'Trending',
    icon: 'flame',
    routeName: 'Trending',
  },

  {
    key: 'Favorites',
    label: 'Favorites',
    icon: 'heart',
    routeName: 'Favorites',
  },

  {
    key: 'Profile',
    label: 'Profile',
    icon: 'person',
    routeName: 'Profile',
  },
] as const;