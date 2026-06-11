import React, { useState, useEffect } from 'react';
import {
    Text,
    View,
    TextInput,
    Pressable,
    ScrollView,
    Platform,
} from 'react-native';

import { styles } from './styles.js';
import {
    getDreamMultiple,
    setDreamMultiple,
    exportPortfolioJson,
    importPortfolioJson,
} from './localStorage.js';

const PRESETS = ['0.5', '2', '4', '8', '10', '15', '20'];
const isWeb = Platform.OS === 'web';

function isStandaloneWebApp() {
    if (!isWeb || typeof window === 'undefined') {
        return false;
    }
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
    );
}

export default function SettingsScreen({ navigation }) {
    const [multiple, setMultiple] = useState('1');
    const [backupMessage, setBackupMessage] = useState('');
    const [importText, setImportText] = useState('');
    const [showImport, setShowImport] = useState(false);

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

    async function copyBackup() {
        try {
            const json = await exportPortfolioJson();
            if (isWeb && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(json);
                setBackupMessage('Portfolio copied to clipboard.');
            } else {
                setImportText(json);
                setShowImport(true);
                setBackupMessage('Copy the backup text below.');
            }
        } catch {
            setBackupMessage('Could not export portfolio.');
        }
    }

    async function pasteFromClipboard() {
        if (!isWeb || !navigator.clipboard?.readText) {
            return;
        }
        try {
            const text = await navigator.clipboard.readText();
            setImportText(text);
            setShowImport(true);
            setBackupMessage('Pasted from clipboard.');
        } catch {
            setBackupMessage('Could not read clipboard.');
        }
    }

    async function restoreBackup() {
        try {
            const count = await importPortfolioJson(importText);
            setBackupMessage(`Restored ${count} assets.`);
            setImportText('');
            setShowImport(false);
        } catch {
            setBackupMessage('Invalid backup — check the JSON and try again.');
        }
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

                {isWeb && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Backup & sync</Text>
                        <Text style={styles.sectionDescription}>
                          Export from one and import into the other to copy your
                          portfolio.
                        </Text>
                        {isStandaloneWebApp() && (
                            <Text style={[styles.bodyText, { marginTop: 8 }]}>
                                You are using the Home Screen app.
                            </Text>
                        )}
                        <Pressable
                            style={({ pressed }) => [
                                styles.buttonSecondary,
                                { marginTop: 16 },
                                pressed && { opacity: 0.85 },
                            ]}
                            onPress={copyBackup}
                        >
                            <Text style={styles.buttonTextSecondary}>
                                Export portfolio
                            </Text>
                        </Pressable>
                        {isWeb &&
                            typeof navigator !== 'undefined' &&
                            navigator.clipboard?.readText && (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.buttonSecondary,
                                    { marginTop: 10 },
                                    pressed && { opacity: 0.85 },
                                ]}
                                onPress={pasteFromClipboard}
                            >
                                <Text style={styles.buttonTextSecondary}>
                                    Paste from clipboard
                                </Text>
                            </Pressable>
                        )}
                        <Pressable
                            style={({ pressed }) => [
                                styles.buttonGhost,
                                { marginTop: 10 },
                                pressed && { opacity: 0.7 },
                            ]}
                            onPress={() => setShowImport((value) => !value)}
                        >
                            <Text style={styles.buttonTextGhost}>
                                {showImport ? 'Hide import' : 'Import portfolio'}
                            </Text>
                        </Pressable>
                        {showImport && (
                            <>
                                <TextInput
                                    style={[styles.modernInput, { marginTop: 12, minHeight: 120 }]}
                                    value={importText}
                                    onChangeText={setImportText}
                                    placeholder="Paste backup JSON here"
                                    placeholderTextColor="#555"
                                    multiline
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.buttonPrimary,
                                        { marginTop: 12 },
                                        pressed && { opacity: 0.85 },
                                    ]}
                                    onPress={restoreBackup}
                                >
                                    <Text style={[styles.buttonTextPrimary, { textAlign: 'center' }]}>
                                        Restore backup
                                    </Text>
                                </Pressable>
                            </>
                        )}
                        {backupMessage ? (
                            <Text style={[styles.bodyText, { marginTop: 12 }]}>
                                {backupMessage}
                            </Text>
                        ) : null}
                    </View>
                )}

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
