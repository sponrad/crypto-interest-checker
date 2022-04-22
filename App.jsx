import React, { useState, useEffect, useRef } from 'react';
import { AppState, View, Text, Image } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AppLoading from 'expo-app-loading';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './src/Home.jsx';
import AddScreen from './src/AddScreen.jsx';
import AssetScreen from './src/AssetScreen.jsx';
import { getLastAuthTime, setLastAuthTime } from './src/localStorage.js';

const IS_DEBUG = false;

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

export function App() {
    const [appIsReady, setAppIsReady] = useState(true);
    const [userAuthed, setUserAuthed] = useState(false);
    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(appState.current);
    async function doAuth() {
        if (userAuthed) {
            return;
        }
        const currentSeconds = new Date().getTime() / 1000;
        const lastAuthTime = await getLastAuthTime();
        if ((currentSeconds - Number(lastAuthTime)) < 10) {
            setUserAuthed(true);
            return;
        }
        if (IS_DEBUG) {
            setUserAuthed(true);
        } else {
            await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate for access',
            }).then(res => {
                setUserAuthed(res.success);
                if (res.success) {
                    setLastAuthTime(new Date().getTime() / 1000);
                }
            });
        }
    }
    useEffect(doAuth, []);
    useEffect(() => {
        AppState.addEventListener('change', _handleAppStateChange);

        return () => {
            AppState.removeEventListener('change', _handleAppStateChange);
        };
    }, []);

    const _handleAppStateChange = nextAppState => {
        if (appState.current === 'active' && nextAppState !== 'active') {
            setUserAuthed(false);
        }
        if (appState.current !== 'active' && nextAppState === 'active') {
            doAuth();
        }

        appState.current = nextAppState;
        setAppStateVisible(appState.current);
        console.log('AppState', appState.current);
    };

    if (!appIsReady) {
        return <AppLoading />;
    }

    if (userAuthed && appState.current === 'active') {
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
        const style = {
            width: 100,
            height: 100,
        };
        return <View style={{
            backgroundColor: '#000',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
          <Image style={style} source={require('./assets/icon.png')} />
          <Text style={{marginTop: 30, color: '#fff'}}>
            👁 Privacy 👁
          </Text>
        </View>;
    }
}
