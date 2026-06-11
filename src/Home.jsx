import React, { useState, useEffect, useRef } from 'react';
import {
    Text,
    View,
    ActivityIndicator,
    TouchableOpacity,
    Pressable,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl } from 'react-native-gesture-handler';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import Ionicons from '@expo/vector-icons/Ionicons';

import { coinDataBackend } from './coinDataBackend.js';
import { styles } from './styles.js';
import { formatCurrency } from './util.js';
import { getAssets, saveAssets, getDreamMultiple } from './localStorage.js';
import AssetRow from './AssetRow.jsx';

const WEB_PULL_THRESHOLD = 72;
const isWeb = Platform.OS === 'web';

export default function Home({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshEnabled, setRefreshEnabled] = useState(true);
    const [holdings, setHoldings] = useState([]);
    const [multiple, setMultiple] = useState(1);
    const [webPullDistance, setWebPullDistance] = useState(0);
    const webPullDistanceRef = useRef(0);
    const webTouchStartY = useRef(null);
    const scrollOffsetY = useRef(0);
    const refreshIdRef = useRef(0);

    function applyDreamPrices(assets, theMultiple) {
        return assets.map((asset) => {
            const copy = asset;
            const basePrice = copy.lastBasePrice || 0;
            copy.price = basePrice * theMultiple;
            return copy;
        });
    }

    async function refresh({ showSpinner = false, fetchPrices = true } = {}) {
        const refreshId = ++refreshIdRef.current;
        if (showSpinner) {
            setRefreshing(true);
        }
        try {
            const theMultiple = (await getDreamMultiple()) || 1;
            if (refreshId !== refreshIdRef.current) {
                return;
            }
            setMultiple(theMultiple);
            const assets = await getAssets();
            if (refreshId !== refreshIdRef.current) {
                return;
            }
            if (assets.length === 0) {
                setHoldings([]);
                return;
            }

            setHoldings(applyDreamPrices(assets, theMultiple));
            setLoading(false);

            const needsPrices =
                fetchPrices || assets.some((asset) => !asset.lastBasePrice);
            if (!needsPrices) {
                return;
            }

            const prices = await coinDataBackend.getAssetsPrices(assets);
            if (refreshId !== refreshIdRef.current) {
                return;
            }

            const latestAssets = await getAssets();
            if (refreshId !== refreshIdRef.current) {
                return;
            }
            latestAssets.forEach((asset) => {
                const fetchedPrice = prices[asset.symbol];
                if (fetchedPrice != null) {
                    asset.lastBasePrice = fetchedPrice;
                }
            });
            await saveAssets(latestAssets);
            if (refreshId !== refreshIdRef.current) {
                return;
            }
            setHoldings(applyDreamPrices(latestAssets, theMultiple));
        } catch {
            // Keep showing cached portfolio if price refresh fails.
        } finally {
            if (refreshId === refreshIdRef.current) {
                setRefreshing(false);
                setLoading(false);
            }
        }
    }

    function pullRefresh() {
        refresh({ showSpinner: true, fetchPrices: true });
    }

    const webPullHandlers = isWeb
        ? {
              onScroll: (event) => {
                  scrollOffsetY.current = event.nativeEvent.contentOffset.y;
              },
              scrollEventThrottle: 16,
              onTouchStart: (event) => {
                  if (!refreshEnabled || refreshing) {
                      return;
                  }
                  webTouchStartY.current = event.nativeEvent.touches[0].pageY;
              },
              onTouchMove: (event) => {
                  if (
                      !refreshEnabled ||
                      refreshing ||
                      webTouchStartY.current == null ||
                      scrollOffsetY.current > 5
                  ) {
                      return;
                  }
                  const delta =
                      event.nativeEvent.touches[0].pageY - webTouchStartY.current;
                  if (delta > 0) {
                      const distance = Math.min(delta, 100);
                      webPullDistanceRef.current = distance;
                      setWebPullDistance(distance);
                  }
              },
              onTouchEnd: () => {
                  if (
                      webPullDistanceRef.current >= WEB_PULL_THRESHOLD &&
                      !refreshing
                  ) {
                      pullRefresh();
                  }
                  webTouchStartY.current = null;
                  webPullDistanceRef.current = 0;
                  setWebPullDistance(0);
              },
              onTouchCancel: () => {
                  webTouchStartY.current = null;
                  webPullDistanceRef.current = 0;
                  setWebPullDistance(0);
              },
          }
        : {};

    useEffect(() => {
        refresh({ fetchPrices: true });
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refresh({ fetchPrices: false });
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
                {isWeb && (refreshing || webPullDistance > 12) && (
                    <View
                        style={{
                            alignItems: 'center',
                            paddingBottom: 8,
                            opacity: refreshing
                                ? 1
                                : Math.min(webPullDistance / WEB_PULL_THRESHOLD, 1),
                        }}
                    >
                        <ActivityIndicator color="#22c55e" size="small" />
                    </View>
                )}

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
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.iconButton,
                                pressed && { opacity: 0.85 },
                            ]}
                            onPress={pullRefresh}
                            disabled={refreshing}
                        >
                            <Ionicons
                                name="refresh"
                                size={22}
                                color={refreshing ? '#555' : '#ddd'}
                            />
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
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                ListFooterComponent={<View style={{ height: 24 }} />}
                {...webPullHandlers}
                onDragBegin={() => setRefreshEnabled(false)}
                onDragEnd={({ data }) => {
                    setRefreshEnabled(true);
                    setHoldings(data);
                    getAssets().then(async (assets) => {
                        const bySymbol = Object.fromEntries(
                            assets.map((asset) => [asset.symbol, asset])
                        );
                        const reordered = data
                            .map((holding) => bySymbol[holding.symbol])
                            .filter(Boolean);
                        if (reordered.length === data.length) {
                            await saveAssets(reordered);
                        }
                    });
                }}
                refreshControl={
                    isWeb ? undefined : (
                        <RefreshControl
                            refreshing={refreshing}
                            enabled={refreshEnabled}
                            colors={['#22c55e']}
                            tintColor="#22c55e"
                            onRefresh={pullRefresh}
                        />
                    )
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
