import React from 'react';
import { View, Text, Pressable } from 'react-native';

const GuestBanner=({onLogin,onSignup}:any)=>(
<View>
<Text>👤 Guest User</Text>
<Pressable onPress={onLogin}><Text>Login</Text></Pressable>
<Pressable onPress={onSignup}><Text>Sign Up</Text></Pressable>
</View>
);

export default GuestBanner;
