import React, { useState, useEffect, useRef } from 'react';
import { AppState, View, Text } from 'react-native';
import { registerRootComponent } from 'expo';
import * as LocalAuthentication from 'expo-local-authentication';
import AppLoading from 'expo-app-loading';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './src/Home.jsx';
import AddScreen from './src/AddScreen.jsx';
import AssetScreen from './src/AssetScreen.jsx';

const IS_DEBUG = true;

const Stack = createNativeStackNavigator();

// https://reactnavigation.org/docs/themes/
const NavTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        background: 'black',
        text: '#ddd',
    },
};

function App() {
    const [appIsReady, setAppIsReady] = useState(IS_DEBUG);
    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(appState.current);

    useEffect(() => {
        if (!IS_DEBUG) {
            LocalAuthentication.authenticateAsync({
                promptMessage: 'test message',
            }).then(res => {
                setAppIsReady(res.success);
            });
        }
    }, []);

    useEffect(() => {
        AppState.addEventListener('change', _handleAppStateChange);

        return () => {
            AppState.removeEventListener('change', _handleAppStateChange);
        };
    }, []);

    const _handleAppStateChange = nextAppState => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
            console.log('App has come to the foreground!');
            // TODO re-auth
        }

        appState.current = nextAppState;
        setAppStateVisible(appState.current);
        console.log('AppState', appState.current);
    };

    if (!appIsReady) {
        return <AppLoading />;
    }

    if (appState.current === 'active') {
        return <NavigationContainer theme={NavTheme}>
          <Stack.Navigator screenOptions={{
              headerShown: false,
              headerStyle: { backgroundColor: 'black' },
          }}>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Add"
                          component={AddScreen}
                          options={{
                              headerShown: true,
                              title: 'Add Asset',
                          }} />
            <Stack.Screen name="Asset"
                          component={AssetScreen}
                          options={{
                              headerShown: true,
                              title: 'Configure Asset',
                          }} />
          </Stack.Navigator>
        </NavigationContainer>;
    } else {
        return <View style={{
            backgroundColor: '#000',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
          <Text style={{color: '#fff'}}>
            👁 Privacy 👁
          </Text>
        </View>;
    }
}

registerRootComponent(App);
