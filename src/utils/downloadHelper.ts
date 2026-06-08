import { Alert, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import {
    File,
    Paths,
} from 'expo-file-system';


export const downloadWallpaper = async (
    imageUrl: string,
    fileName?: string
) => {
    try {

        // Ask gallery permission
        const permission =
            await MediaLibrary.requestPermissionsAsync();

        if (!permission.granted) {
            Alert.alert(
                'Permission Required',
                'Allow gallery access to save wallpapers'
            );

            return false;
        }


        // create local file path
        const file =
            new File(
                Paths.cache,
                fileName ?? `${Date.now()}.jpg`
            );


        // download image
        await File.downloadFileAsync(
            imageUrl,
            file
        );


        // save to gallery
        const asset =
            await MediaLibrary.createAssetAsync(
                file.uri
            );


        // create album
        const album =
            await MediaLibrary.getAlbumAsync(
                'VividWalls'
            );


        if (album) {
            await MediaLibrary.addAssetsToAlbumAsync(
                [asset],
                album,
                false
            );
        }
        else {

            await MediaLibrary.createAlbumAsync(
                'VividWalls',
                asset,
                false
            );

        }


        Alert.alert(
            'Downloaded',
            'Wallpaper saved successfully'
        );


        return true;

    } catch (error) {

        console.log(
            'Download Error:',
            error
        );

        Alert.alert(
            'Error',
            'Download failed'
        );

        return false;

    }
};