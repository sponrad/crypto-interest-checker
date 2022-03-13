import React, { useState, useEffect, useRef } from 'react';
import { AppState, View, Text } from 'react-native';
import { registerRootComponent } from 'expo';
import * as LocalAuthentication from 'expo-local-authentication';
import AppLoading from 'expo-app-loading';

import Home from './src/Home.jsx';

IS_DEBUG = true;


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
        return <Home />;
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
