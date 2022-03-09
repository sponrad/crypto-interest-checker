import React, { useState, useEffect, useRef } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';
import * as LocalAuthentication from 'expo-local-authentication';
import AppLoading from 'expo-app-loading';

IS_DEBUG = false;


function App() {
    const [appIsReady, setAppIsReady] = useState(false);
    const appState = useRef(AppState.currentState);
    const [appStateVisible, setAppStateVisible] = useState(appState.current);

    useEffect(() => {
        if (!IS_DEBUG) {
            LocalAuthentication.authenticateAsync({
                promptMessage: 'test message',
            }).then(res => {
                setAppIsReady(res.success);
                console.log(res.success);
                console.log('hi');
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

    if (!appIsReady || appState.current !== 'active') {
        return <AppLoading />;
    }

    return <View style={styles.container}>
      <Text style={styles.text}>Cranking it out yo</Text>
      <Text style={styles.text}>Current state: {appStateVisible}</Text>
    </View>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#ddd',
    },
});

registerRootComponent(App);
