import React, { useState, useEffect } from 'react';
import {
    Text,
    View,
    TextInput,
    ScrollView,
    Pressable,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from './styles.js';
import { getAssets, saveAssets } from './localStorage.js';
import AssetRow from './AssetRow.jsx';

function FormSection({ label, children }) {
    return (
        <View style={styles.card}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {children}
        </View>
    );
}

export default function AssetScreen({ route, navigation }) {
    const { symbol, price } = route.params;
    const [asset, setAsset] = useState(null);
    const [editQuantity, setEditQuantity] = useState(false);
    const [quantity, setQuantity] = useState(null);
    const [editInterest, setEditInterest] = useState(false);
    const [interestRate, setInterestRate] = useState('0');

    async function load() {
        const assets = await getAssets();
        const theAsset = assets.find((a) => a.symbol === symbol);
        navigation.setOptions({
            title: theAsset.symbol,
        });
        theAsset.price = price;
        setAsset(theAsset);
        setQuantity(theAsset.quantity.toString());
        setInterestRate(theAsset.globalInterest().toString());
    }

    useEffect(() => {
        load();
    }, []);

    if (!asset) {
        return null;
    }

    async function onSaveQuantity() {
        const assets = await getAssets();
        const index = assets.findIndex((a) => a.symbol === symbol);
        assets[index].quantity = Number(quantity);
        assets[index].price = asset.price;
        assets[index].setInterestRate(
            Number(interestRate) || assets[index].globalInterest()
        );
        saveAssets(assets);
        setAsset(assets[index]);
        setEditQuantity(false);
    }

    async function onRemove() {
        const assets = await getAssets();
        saveAssets(assets.filter((a) => a.symbol !== symbol));
        navigation.pop();
    }

    async function onSaveInterestRate() {
        const assets = await getAssets();
        const index = assets.findIndex((a) => a.symbol === symbol);
        assets[index].setInterestRate(Number(interestRate));
        saveAssets(assets);
        setAsset((prevAsset) => {
            const assetCopy = prevAsset;
            assetCopy.setInterestRate(Number(interestRate));
            return assetCopy;
        });
        setEditInterest(false);
    }

    function cancelQuantityEdit() {
        setQuantity(asset.quantity.toString());
        setEditQuantity(false);
    }

    function cancelInterestEdit() {
        setInterestRate(asset.globalInterest().toString());
        setEditInterest(false);
    }

    const interestDisplay = asset.globalInterest();

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 8,
                        paddingBottom: 32,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View
                        style={{
                            ...styles.card,
                            marginBottom: 20,
                            paddingVertical: 12,
                        }}
                    >
                        <AssetRow asset={asset} embedded />
                    </View>

                    <FormSection label="Holdings">
                        {!editQuantity ? (
                            <>
                                <Text style={styles.valueLarge}>{asset.quantity}</Text>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.buttonSecondary,
                                        pressed && { opacity: 0.85 },
                                    ]}
                                    onPress={() => setEditQuantity(true)}
                                >
                                    <Text style={styles.buttonTextSecondary}>Edit quantity</Text>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <TextInput
                                    style={styles.modernInput}
                                    onChangeText={setQuantity}
                                    value={quantity}
                                    placeholder="Quantity"
                                    placeholderTextColor="#555"
                                    keyboardType="decimal-pad"
                                    autoFocus
                                />
                                <View style={[styles.buttonRow, { marginTop: 14 }]}>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.buttonPrimary,
                                            styles.buttonPrimaryInRow,
                                            (!quantity || pressed) && { opacity: quantity ? 0.85 : 0.45 },
                                        ]}
                                        disabled={!quantity}
                                        onPress={onSaveQuantity}
                                    >
                                        <Text style={styles.buttonTextPrimary}>Save</Text>
                                    </Pressable>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.buttonGhost,
                                            pressed && { opacity: 0.7 },
                                        ]}
                                        onPress={cancelQuantityEdit}
                                    >
                                        <Text style={styles.buttonTextGhost}>Cancel</Text>
                                    </Pressable>
                                </View>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.buttonDestructive,
                                        pressed && { opacity: 0.85 },
                                    ]}
                                    onPress={onRemove}
                                >
                                    <Text style={styles.buttonTextDestructive}>
                                        Remove {asset.name}
                                    </Text>
                                </Pressable>
                            </>
                        )}
                    </FormSection>

                    <FormSection label="Interest rate">
                        {!editInterest ? (
                            <>
                                <Text style={styles.valueLarge}>
                                    {interestDisplay}
                                    <Text style={{ fontSize: 18, color: '#666', fontWeight: '500' }}>
                                        %
                                    </Text>
                                </Text>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.buttonSecondary,
                                        pressed && { opacity: 0.85 },
                                    ]}
                                    onPress={() => {
                                        setInterestRate(interestDisplay.toString());
                                        setEditInterest(true);
                                    }}
                                >
                                    <Text style={styles.buttonTextSecondary}>
                                        Edit interest rate
                                    </Text>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <TextInput
                                    style={styles.modernInput}
                                    onChangeText={setInterestRate}
                                    value={interestRate}
                                    placeholder="e.g. 5.25"
                                    placeholderTextColor="#555"
                                    keyboardType="decimal-pad"
                                    autoFocus
                                />
                                <Text
                                    style={{
                                        color: '#555',
                                        fontSize: 13,
                                        marginTop: 8,
                                        marginBottom: 4,
                                    }}
                                >
                                    Annual percentage yield
                                </Text>
                                <View style={[styles.buttonRow, { marginTop: 10 }]}>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.buttonPrimary,
                                            styles.buttonPrimaryInRow,
                                            (!interestRate || pressed) && {
                                                opacity: interestRate ? 0.85 : 0.45,
                                            },
                                        ]}
                                        disabled={!interestRate}
                                        onPress={onSaveInterestRate}
                                    >
                                        <Text style={styles.buttonTextPrimary}>Save</Text>
                                    </Pressable>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.buttonGhost,
                                            pressed && { opacity: 0.7 },
                                        ]}
                                        onPress={cancelInterestEdit}
                                    >
                                        <Text style={styles.buttonTextGhost}>Cancel</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </FormSection>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
