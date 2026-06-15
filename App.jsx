import React, { useState, useEffect, useRef } from 'react';
import { AppState, View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './src/Home.jsx';
import AddScreen from './src/AddScreen.jsx';
import AssetScreen from './src/AssetScreen.jsx';
import SettingsScreen from './src/SettingsScreen.jsx';
import PrivacySplash from './src/PrivacySplash.jsx';
import WebTabPrivacyGuard from './src/WebTabPrivacyGuard.jsx';
import { getLastAuthTime, setLastAuthTime } from './src/localStorage.js';

const IS_DEBUG = false;

const Stack = createNativeStackNavigator();

// https://reactnavigation.org/docs/themes/
const NavTheme = {
    ...DarkTheme,
    dark: true,
    colors: {
        ...DarkTheme.colors,
        background: 'black',
        text: '#ddd',
    },
};

export function App() {
    const [userAuthed, setUserAuthed] = useState(false);
    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(appState.current);
    async function doAuth() {
        if (userAuthed) {
            return;
        }
        if (Platform.OS === 'web') {
            setUserAuthed(true);
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
    useEffect(() => {
        doAuth();
    }, []);
    useEffect(() => {
        const subscription = AppState.addEventListener('change', _handleAppStateChange);
        return () => subscription.remove();
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

    const content = userAuthed && appState.current === 'active'
        ? <View style={{
            flex: 1,
            backgroundColor: '#000',
        }}>
          <NavigationContainer theme={NavTheme}>
            <Stack.Navigator screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: 'black' },
                contentStyle: { flex: 1, backgroundColor: '#000' },
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
              <Stack.Screen name="Settings"
                            component={SettingsScreen}
                            options={{
                                headerShown: true,
                                title: 'Settings',
                            }} />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
        : <PrivacySplash />;

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
            <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000' }}>
                <WebTabPrivacyGuard>{content}</WebTabPrivacyGuard>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
