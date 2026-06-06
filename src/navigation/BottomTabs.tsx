import React from "react";

import {
createBottomTabNavigator
} from "@react-navigation/bottom-tabs";


import HomeScreen 
from "../screens/Home/HomeScreen";

import AboutScreen
from "../screens/About/AboutScreen";

import CategoryScreen
from "../screens/Category/CategoryScreen";

import ProfileScreen
from "../screens/Profile/ProfileScreen";


const Tab =
createBottomTabNavigator();



export default function BottomTabs(){


return(

<Tab.Navigator>


<Tab.Screen

name="Home"
component={HomeScreen}

/>


<Tab.Screen

name="Category"
component={CategoryScreen}

/>


<Tab.Screen

name="About"
component={AboutScreen}

/>


<Tab.Screen

name="Profile"
component={ProfileScreen}

/>


</Tab.Navigator>


)

}