import React, { useState, useEffect } from 'react';
import {
    Text,
    View,
    TextInput,
    Pressable,
    ScrollView,
} from 'react-native';

import { styles } from './styles.js';
import { getDreamMultiple, setDreamMultiple } from './localStorage.js';

const PRESETS = ['0.5', '2', '4', '8', '10', '15', '20'];

export default function SettingsScreen({ navigation }) {
    const [multiple, setMultiple] = useState('1');

    useEffect(() => {
        getDreamMultiple().then((value) => {
            setMultiple(value.toString());
        });
    }, []);

    const multipleNum = Number(multiple) || 1;
    const isDreamMode = multipleNum >= 1;
    const isActive = (value) => multipleNum === Number(value);

    function updateDreamMultiple(val) {
        setMultiple(val);
    }

    async function applyDreamMultiple(val) {
        updateDreamMultiple(val);
        await setDreamMultiple(val);
    }

    async function dreamAndLeave(val) {
        await applyDreamMultiple(val);
        navigation.navigate('Home');
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.screenPadding}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        {isDreamMode ? 'Dream' : 'Nightmare'} mode
                    </Text>
                    <Text style={styles.sectionDescription}>
                        Multiply asset prices to see how your portfolio performs as
                        the market changes. Only affects the main screen.
                    </Text>

                    {multipleNum !== 1 && (
                        <Text style={[styles.valueLarge, { marginTop: 16, marginBottom: 0 }]}>
                            {multipleNum}
                            <Text style={{ fontSize: 18, color: '#666', fontWeight: '500' }}>
                                x
                            </Text>
                        </Text>
                    )}

                    <View style={styles.chipGrid}>
                        {PRESETS.map((dream) => {
                            const active = isActive(dream);
                            return (
                                <Pressable
                                    key={dream}
                                    onPress={() => dreamAndLeave(dream)}
                                    style={({ pressed }) => [
                                        styles.chip,
                                        active && styles.chipActive,
                                        pressed && !active && { opacity: 0.85 },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            active && styles.chipTextActive,
                                        ]}
                                    >
                                        {dream}x
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {multipleNum !== 1 && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.buttonSecondary,
                                { marginTop: 16 },
                                pressed && { opacity: 0.85 },
                            ]}
                            onPress={() => dreamAndLeave('1')}
                        >
                            <Text style={styles.buttonTextSecondary}>Reset to 1x</Text>
                        </Pressable>
                    )}

                    <Text style={[styles.fieldLabel, { marginTop: 24 }]}>
                        Custom multiplier
                    </Text>
                    <TextInput
                        style={styles.modernInput}
                        value={multiple}
                        onChangeText={updateDreamMultiple}
                        placeholder="e.g. 1, 10, 0.5"
                        placeholderTextColor="#555"
                        keyboardType="decimal-pad"
                    />
                    <Pressable
                        style={({ pressed }) => [
                            styles.buttonPrimary,
                            { marginTop: 12 },
                            pressed && { opacity: 0.85 },
                        ]}
                        onPress={() => applyDreamMultiple(multiple).then(() => navigation.navigate('Home'))}
                    >
                        <Text style={[styles.buttonTextPrimary, { textAlign: 'center' }]}>
                            Apply & return home
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.bodyText}>
                        Crypto Checker with Interest by Conrad Frame.
                    </Text>
                    <Text style={styles.bodyText}>
                        Email{' '}
                        <Text selectable style={styles.linkText}>
                            conrad@devlabtech.com
                        </Text>{' '}
                        for support.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
