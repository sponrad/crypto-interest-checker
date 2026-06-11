import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset, InterestAccount } from './models.js';

const secureStorageKey = (key) => `secure:${key}`;
const assetsKey = 'local-storage-asset-key';
const webPortfolioKey = 'crypto-checker-portfolio-v1';

function assetToJson(asset) {
    return {
        name: asset.name,
        symbol: asset.symbol,
        imageUrl: asset.imageUrl,
        coinId: asset.coinId,
        quantity: asset.quantity,
        lastBasePrice: asset.lastBasePrice || 0,
        interestAccounts: asset.interestAccounts.map((ia) => ({
            name: ia.name,
            interestTiers: ia.interestTiers,
            quantity: ia.quantity,
        })),
    };
}

function jsonToAsset(json) {
    const interestAccounts = normalizeInterestAccounts(json);
    const imageUrl =
        typeof json.imageUrl === 'string'
            ? json.imageUrl
            : typeof json.i === 'string'
              ? json.i
              : null;
    const asset = new Asset(
        json.name || json.n,
        json.symbol || json.s,
        imageUrl,
        json.quantity ?? json.q ?? 0,
        interestAccounts,
        json.coinId || json.c,
    );
    asset.lastBasePrice = Number(json.lastBasePrice) || 0;
    return asset;
}

function parseStoredAssets(parsed) {
    if (Array.isArray(parsed)) {
        return parsed.map(jsonToAsset);
    }
    if (parsed?.assets && Array.isArray(parsed.assets)) {
        return parsed.assets.map(jsonToAsset);
    }
    return null;
}

function normalizeInterestAccounts(json) {
    let raw = json.interestAccounts;
    if (!raw && Array.isArray(json.i) && json.i.length > 0 && json.i[0]?.t) {
        raw = json.i;
    }
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.map(
        (ia) =>
            new InterestAccount(
                ia.name || ia.n,
                ia.interestTiers || ia.t,
                ia.quantity ?? ia.q ?? 0
            )
    );
}

async function save(key, value) {
    if (Platform.OS === 'web') {
        await AsyncStorage.setItem(secureStorageKey(key), value);
        return;
    }
    await SecureStore.setItemAsync(key, value);
}

async function getValueFor(key) {
    if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(secureStorageKey(key));
    }
    const result = await SecureStore.getItemAsync(key);
    if (!result) {
        return null;
    }
    return result;
}

async function saveInsecure(key, value) {
    await AsyncStorage.setItem(key, value);
}

async function getInsecureValueFor(key) {
    const result = await AsyncStorage.getItem(key);
    if (!result) {
        return '[]';
    }
    return result;
}

async function loadLegacyNativeAssets() {
    const assetsData = await getValueFor(assetsKey);
    if (!assetsData) {
        return [];
    }
    let combinedData = JSON.parse(assetsData);
    const nonsecureData = await getInsecureValueFor(assetsKey);
    JSON.parse(nonsecureData).forEach((json, idx) => {
        if (combinedData[idx]?.symbol !== json.symbol) {
            return;
        }
        combinedData[idx] = {
            ...combinedData[idx],
            ...json,
        };
    });
    return combinedData.map(jsonToAsset);
}

async function loadWebAssets() {
    const stored = await AsyncStorage.getItem(webPortfolioKey);
    if (stored) {
        try {
            const assets = parseStoredAssets(JSON.parse(stored));
            if (assets) {
                return assets;
            }
        } catch {
            // Fall through to legacy keys.
        }
    }

    const legacy = await loadLegacyNativeAssets();
    if (legacy.length > 0) {
        await saveWebAssets(legacy);
    }
    return legacy;
}

async function saveWebAssets(assets) {
    await AsyncStorage.setItem(
        webPortfolioKey,
        JSON.stringify({
            version: 1,
            pricesFetchedAt: Date.now(),
            assets: assets.map(assetToJson),
        })
    );
}

async function saveNativeAssets(assets) {
    const jsonNonsecureToSave = JSON.stringify(
        assets.map((asset) => ({
            name: asset.name,
            symbol: asset.symbol,
            imageUrl: asset.imageUrl,
            coinId: asset.coinId,
            s: asset.symbol,
            n: asset.name,
            i: asset.imageUrl,
            c: asset.coinId,
        }))
    );
    await saveInsecure(assetsKey, jsonNonsecureToSave);
    const jsonToSave = JSON.stringify(
        assets.map((asset) => ({
            symbol: asset.symbol,
            coinId: asset.coinId,
            c: asset.coinId,
            quantity: asset.quantity,
            interestAccounts: asset.interestAccounts.map((ia) => ({
                name: ia.name,
                interestTiers: ia.interestTiers,
                quantity: ia.quantity,
            })),
            lastBasePrice: asset.lastBasePrice || 0,
            s: asset.symbol,
            q: asset.quantity,
            i: asset.interestAccounts.map((ia) => ({
                n: ia.name,
                t: ia.interestTiers,
                q: ia.quantity,
            })),
        }))
    );
    await save(assetsKey, jsonToSave);
}

export async function getAssets() {
    try {
        if (Platform.OS === 'web') {
            return await loadWebAssets();
        }
        return await loadLegacyNativeAssets();
    } catch {
        return [];
    }
}

export async function saveAssets(assets) {
    const validAssets = assets.filter(Boolean);
    if (Platform.OS === 'web') {
        await saveWebAssets(validAssets);
        return;
    }
    await saveNativeAssets(validAssets);
}

const authTimeKey = 'auth-time-key';

export async function getLastAuthTime() {
    const seconds = await getValueFor(authTimeKey);
    if (seconds == null) {
        return null;
    }
    return JSON.parse(seconds);
}

export function setLastAuthTime(seconds) {
    save(authTimeKey, JSON.stringify(seconds));
}

const dreamMultipleKey = 'dream-mode-multiple-key';

export async function getDreamMultiple() {
    const multiple = await AsyncStorage.getItem(dreamMultipleKey);
    if (multiple == null || multiple === '') {
        return 1;
    }
    const value = Number(multiple);
    return Number.isFinite(value) ? value : 1;
}

export async function setDreamMultiple(multiple) {
    await saveInsecure(dreamMultipleKey, multiple.toString());
}

export async function exportPortfolioJson() {
    const assets = await getAssets();
    return JSON.stringify(
        {
            version: 1,
            exportedAt: new Date().toISOString(),
            assets: assets.map(assetToJson),
        },
        null,
        2
    );
}

export async function importPortfolioJson(jsonString) {
    const parsed = JSON.parse(jsonString);
    const list = Array.isArray(parsed) ? parsed : parsed?.assets;
    if (!Array.isArray(list)) {
        throw new Error('Invalid backup format');
    }
    const assets = list.map(jsonToAsset);
    await saveAssets(assets);
    return assets.length;
}
