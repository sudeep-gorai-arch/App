import React from "react";

import {
NavigationContainer
} from "@react-navigation/native";


import BottomTabs from "./BottomTabs";



const AppNavigator=()=>{


return(

<NavigationContainer>

<BottomTabs/>

</NavigationContainer>

)

}


export default AppNavigator;