import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset, InterestAccount } from './models.js';

const secureStorageKey = (key) => `secure:${key}`;

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
    let result = await AsyncStorage.getItem(key);
    if (!result) {
        return '[]';
    }
    return result;
}

const assetsKey = 'local-storage-asset-key';

export async function getAssets() {
    const assetsData = await getValueFor(assetsKey);
    if (!assetsData) {
        return [];
    }
    let combinedData = [];
    combinedData = JSON.parse(assetsData);
    const nonsecureData = await getInsecureValueFor(assetsKey);
    // pile in the nonsecure data
    JSON.parse(nonsecureData).forEach((json, idx) => {
        // TODO rename to abbreviated forms
        if (combinedData[idx].symbol !== json.symbol) {
            return;
        }
        combinedData[idx] = {
            ...combinedData[idx],
            ...json,
        };
    })
    return combinedData.map(json => {
        return new Asset(
            json.name,
            json.symbol,
            json.imageUrl,
            // TODO rename these to abbreviated forms
            json.quantity,
            json.interestAccounts.map(
                ia => {
                    return new InterestAccount(
                        ia.name,
                        ia.interestTiers,
                        ia.quantity,
                    );
                }
            ),
            json.coinId || json.c,
        );
    });
}

export function saveAssets(assets) {
    const jsonNonsecureToSave = JSON.stringify(assets.map(asset => {
        return {
            name: asset.name,
            symbol: asset.symbol,
            imageUrl: asset.imageUrl,
            coinId: asset.coinId,
            s: asset.symbol,
            n: asset.name,
            i: asset.imageUrl,
            c: asset.coinId,
        };
    }));
    saveInsecure(assetsKey, jsonNonsecureToSave);
    const jsonToSave = JSON.stringify(assets.map(asset => {
        // TODO get rid of these doubled up long-name versions
        // abbreviating these keys to save SecureStore space
        return {
            symbol: asset.symbol,
            coinId: asset.coinId,
            c: asset.coinId,
            quantity: asset.quantity,
            interestAccounts: asset.interestAccounts.map(
                ia => {
                    return {
                        name: ia.name,
                        interestTiers: ia.interestTiers,
                        quantity: ia.quantity,
                    };
                }
            ),
            s: asset.symbol,
            q: asset.quantity,
            // interestAccounts
            i: asset.interestAccounts.map(
                ia => {
                    return {
                        // name
                        n: ia.name,
                        // interestTiers
                        t: ia.interestTiers,
                        // quantity
                        q: ia.quantity,
                    };
                }
            ),
        };
    }));
    // console.log(jsonToSave.length);
    // console.log(jsonToSave);
    // Provided value to SecureStore is larger than 2048 bytes. An attempt to
    // store such a value will throw an error in SDK 35.
    save(assetsKey, jsonToSave);
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
