import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';

export default function PrivacySplash({ onUnlock }) {
    const content = (
        <>
            <Image
                style={{ width: 100, height: 100 }}
                source={require('../assets/icon.png')}
            />
            <Text style={{ marginTop: 30, color: '#fff' }}>👁 Privacy 👁</Text>
            {onUnlock ? (
                <Text style={{ marginTop: 20, color: '#888', fontSize: 14 }}>
                    Tap to view portfolio
                </Text>
            ) : null}
        </>
    );

    const containerStyle = {
        backgroundColor: '#000',
        flex: 1,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    };

    if (onUnlock) {
        return (
            <Pressable style={containerStyle} onPress={onUnlock} accessibilityRole="button">
                {content}
            </Pressable>
        );
    }

    return <View style={containerStyle}>{content}</View>;
}
