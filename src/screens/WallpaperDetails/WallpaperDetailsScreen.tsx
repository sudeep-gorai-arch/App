
import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { downloadWallpaper } from '../../utils/downloadHelper';

export default function WallpaperDetailsScreen({ route }: any) {
  const wallpaper = route.params.wallpaper;

  return (
    <View style={{flex:1}}>
      <Image source={{uri: wallpaper.imageUrl}} style={{flex:1}} />

      <Pressable
        onPress={() => downloadWallpaper(wallpaper.imageUrl)}
      >
        <Text>Download</Text>
      </Pressable>
    </View>
  );
}
