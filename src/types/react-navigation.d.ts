declare module '@react-navigation/native' {
    export interface NavigationContainer {
        children: React.ReactNode;
    }
    export const NavigationContainer: React.ComponentType<any>;
}

/*
declare module '@react-navigation/stack' {
    export function createStackNavigator(): any;
}
*/
