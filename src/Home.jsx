import React, { useState, useEffect } from 'react';
import {
    Text,
    View,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    TouchableOpacity,
    Pressable,
    Platform,
} from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import Ionicons from '@expo/vector-icons/Ionicons';

import { coinDataBackend } from './coinDataBackend.js';
import { styles } from './styles.js';
import { formatCurrency } from './util.js';
import { getAssets, saveAssets, getDreamMultiple } from './localStorage.js';
import AssetRow from './AssetRow.jsx';

export default function Home({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [holdings, setHoldings] = useState([]);
    const [multiple, setMultiple] = useState(1);

    async function refresh() {
        const theMultiple = (await getDreamMultiple()) || 1;
        setMultiple(theMultiple);
        const assets = await getAssets();
        if (assets.length === 0) {
            setRefreshing(false);
            setLoading(false);
            setHoldings([]);
            return;
        }
        coinDataBackend.getAssetsPrices(assets).then((prices) => {
            setHoldings(
                assets.map((asset) => {
                    asset.price = prices[asset.symbol] * theMultiple;
                    return asset;
                })
            );
        }).finally(() => {
            setRefreshing(false);
            setLoading(false);
        });
    }

    function pullRefresh() {
        setRefreshing(true);
        refresh();
    }

    useEffect(() => {
        refresh();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refresh();
        });
        return unsubscribe;
    }, [navigation]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#22c55e" size="large" />
                    <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                        Loading portfolio
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const totalBalance = holdings.reduce((prev, curr) => prev + curr.balance(), 0);
    const totalInterest = holdings.reduce((prev, curr) => prev + curr.yearly(), 0);
    const hasHoldings = holdings.length > 0;

    function ListHeader() {
        return (
            <View
                style={{
                    paddingHorizontal: 16,
                    paddingTop: Platform.OS === 'android' ? 8 : 0,
                }}
            >
                <View style={styles.homeToolbar}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && { opacity: 0.85 },
                        ]}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Ionicons name="menu" size={24} color="#ddd" />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && { opacity: 0.85 },
                        ]}
                        onPress={() => navigation.navigate('Add')}
                    >
                        <Ionicons name="add" size={26} color="#ddd" />
                    </Pressable>
                </View>

                {multiple !== 1 && (
                    <Pressable
                        onPress={() => navigation.navigate('Settings')}
                        style={[
                            styles.dreamBanner,
                            multiple < 1 && styles.dreamBannerNegative,
                        ]}
                    >
                        <Text
                            style={[
                                styles.dreamBannerText,
                                { color: multiple >= 1 ? '#22c55e' : '#f87171' },
                            ]}
                        >
                            Prices multiplied {multiple}x — tap to adjust
                        </Text>
                    </Pressable>
                )}

                {hasHoldings ? (
                    <View style={[styles.card, { marginBottom: 12 }]}>
                        <Text style={styles.fieldLabel}>Total balance</Text>
                        <Text
                            style={styles.portfolioBalance}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.5}
                        >
                            {formatCurrency(totalBalance, false)}
                        </Text>
                        <Text
                            style={styles.portfolioInterest}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                        >
                            {formatCurrency(totalInterest / 12, false)} / mo interest
                        </Text>
                    </View>
                ) : (
                    !refreshing && (
                        <View style={[styles.card, { alignItems: 'center' }]}>
                            <Text style={styles.sectionTitle}>No assets yet</Text>
                            <Text style={[styles.sectionDescription, { textAlign: 'center' }]}>
                                Add holdings to track balances and interest.
                            </Text>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.buttonSecondary,
                                    { marginTop: 16, alignSelf: 'stretch' },
                                    pressed && { opacity: 0.85 },
                                ]}
                                onPress={() => navigation.navigate('Add')}
                            >
                                <Text style={styles.buttonTextSecondary}>Add assets</Text>
                            </Pressable>
                        </View>
                    )
                )}
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <DraggableFlatList
                data={holdings}
                keyExtractor={(holding) => holding.symbol}
                ListHeaderComponent={ListHeader}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListFooterComponent={<View style={{ height: 24 }} />}
                onDragEnd={({ data }) => {
                    setHoldings(data);
                    getAssets().then((assets) => {
                        saveAssets(
                            data.map((holding) =>
                                assets.find((asset) => asset.symbol === holding.symbol)
                            )
                        );
                    });
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        colors={['#22c55e']}
                        tintColor="#22c55e"
                        onRefresh={pullRefresh}
                    />
                }
                renderItem={({ item, drag, isActive }) => {
                    const holding = item;
                    if (!holding) {
                        return null;
                    }
                    return (
                        <ScaleDecorator>
                            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                                <TouchableOpacity
                                    onLongPress={drag}
                                    disabled={isActive}
                                    activeOpacity={0.85}
                                    onPress={() => {
                                        navigation.navigate('Asset', {
                                            symbol: holding.symbol,
                                            price: holding.price,
                                        });
                                    }}
                                >
                                    <AssetRow asset={holding} isActive={isActive} />
                                </TouchableOpacity>
                            </View>
                        </ScaleDecorator>
                    );
                }}
            />
        </SafeAreaView>
    );
}
