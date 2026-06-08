
import React from 'react';
import { Pressable, Text } from 'react-native';

export default function DownloadButton({onPress}:any){
 return <Pressable onPress={onPress}><Text>Download</Text></Pressable>
}
