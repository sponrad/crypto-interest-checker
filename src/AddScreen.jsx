import React, { useState, useEffect, useMemo } from 'react';
import {
    Text,
    View,
    ActivityIndicator,
    FlatList,
    TextInput,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { coinDataBackend } from './coinDataBackend.js';
import { styles } from './styles.js';
import AssetImage from './AssetImage.jsx';
import { getAssets, saveAssets } from './localStorage.js';

function FormSection({ label, children }) {
    return (
        <View style={styles.card}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {children}
        </View>
    );
}

export default function AddScreen({ navigation }) {
    const [text, onChangeText] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [quantity, onChangeQuantity] = useState('');
    const [availableAssets, setAvailableAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [loadedAll, setLoadedAll] = useState(false);

    function loadMore() {
        if (loading || loadedAll) {
            return;
        }
        setLoading(true);
        coinDataBackend
            .getTopAssets(page)
            .then((assets) => {
                setPage(page + 1);
                const currentSymbols = availableAssets.map((asset) => asset.symbol);
                const dedupedAssets = assets.filter(
                    (asset) => !currentSymbols.includes(asset.symbol)
                );
                setAvailableAssets(availableAssets.concat(dedupedAssets));
                if (assets.length === 0) {
                    setLoadedAll(true);
                }
            })
            .catch(() => setLoadedAll(true))
            .finally(() => setLoading(false));
    }

    useEffect(loadMore, []);

    const filteredAssets = useMemo(
        () =>
            availableAssets.filter((asset) => {
                return (
                    asset.name.toLowerCase().includes(text.toLowerCase()) ||
                    asset.symbol.toLowerCase() === text.toLowerCase()
                );
            }),
        [text, availableAssets]
    );

    if (!loading && !loadedAll && !!text && filteredAssets.length < 10) {
        loadMore();
    }

    function clearSelection() {
        setSelectedAsset(null);
        onChangeQuantity('');
    }

    async function onSave() {
        const assets = await getAssets();
        const currentSymbols = assets.map((asset) => asset.symbol);
        if (currentSymbols.includes(selectedAsset.symbol)) {
            const index = assets.findIndex(
                (asset) => asset.symbol === selectedAsset.symbol
            );
            assets[index].quantity += Number(quantity);
            saveAssets(assets);
        } else {
            selectedAsset.quantity = Number(quantity);
            saveAssets(assets.concat([selectedAsset]));
        }
        navigation.navigate('Home');
    }

    const renderItem = ({ item: asset }) => (
        <Pressable
            onPress={() => setSelectedAsset(asset)}
            style={({ pressed }) => [
                styles.listRow,
                pressed && styles.listRowPressed,
            ]}
        >
            <AssetImage asset={asset} />
            <View style={styles.listRowText}>
                <Text style={styles.listRowName}>{asset.name}</Text>
                <Text style={styles.listRowSymbol}>{asset.symbol}</Text>
            </View>
        </Pressable>
    );

    if (selectedAsset) {
        return (
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.screenPadding}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={{ ...styles.card, marginBottom: 20 }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <AssetImage asset={selectedAsset} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.listRowName}>
                                        {selectedAsset.name}
                                    </Text>
                                    <Text style={styles.listRowSymbol}>
                                        {selectedAsset.symbol}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <FormSection label="Holdings">
                            <TextInput
                                style={styles.modernInput}
                                onChangeText={onChangeQuantity}
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
                                        (!quantity || pressed) && {
                                            opacity: quantity ? 0.85 : 0.45,
                                        },
                                    ]}
                                    disabled={!quantity}
                                    onPress={onSave}
                                >
                                    <Text style={styles.buttonTextPrimary}>
                                        Add to portfolio
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.buttonGhost,
                                        pressed && { opacity: 0.7 },
                                    ]}
                                    onPress={clearSelection}
                                >
                                    <Text style={styles.buttonTextGhost}>Back</Text>
                                </Pressable>
                            </View>
                        </FormSection>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
                <Text style={styles.fieldLabel}>Search assets</Text>
                <TextInput
                    onChangeText={onChangeText}
                    style={styles.modernInput}
                    placeholder="Name or symbol…"
                    placeholderTextColor="#555"
                    value={text}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {loading && filteredAssets.length === 0 && (
                <ActivityIndicator
                    size="large"
                    style={{ marginTop: 24 }}
                    color="#22c55e"
                />
            )}

            {loadedAll && filteredAssets.length === 0 && (
                <Text style={styles.emptyText}>
                    {text ? 'No assets match your search' : 'No assets loaded'}
                </Text>
            )}

            <FlatList
                contentContainerStyle={{
                    ...styles.screenPadding,
                    paddingTop: 0,
                }}
                data={filteredAssets}
                keyExtractor={(item) => item.symbol}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={
                    loading && filteredAssets.length > 0 ? (
                        <ActivityIndicator
                            size="small"
                            color="#22c55e"
                            style={{ marginVertical: 16 }}
                        />
                    ) : null
                }
            />
        </SafeAreaView>
    );
}
