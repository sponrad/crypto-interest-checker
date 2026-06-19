import { Asset, InterestAccount } from './models.js';

const webPortfolioKey = 'crypto-checker-portfolio-v1';
const legacySecurePrefix = 'secure:';
const legacyAssetsKey = 'local-storage-asset-key';
const dreamMultipleKey = 'dream-mode-multiple-key';

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
                ia.quantity ?? ia.q ?? 0,
            ),
    );
}

function getItem(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function setItem(key, value) {
    localStorage.setItem(key, value);
}

async function loadLegacyWebAssets() {
    const secureData = getItem(legacySecurePrefix + legacyAssetsKey);
    if (!secureData) {
        return [];
    }
    let combinedData = JSON.parse(secureData);
    const nonsecureData = getItem(legacyAssetsKey);
    if (nonsecureData) {
        JSON.parse(nonsecureData).forEach((json, idx) => {
            if (combinedData[idx]?.symbol !== json.symbol) {
                return;
            }
            combinedData[idx] = {
                ...combinedData[idx],
                ...json,
            };
        });
    }
    return combinedData.map(jsonToAsset);
}

async function loadWebAssets() {
    const stored = getItem(webPortfolioKey);
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

    const legacy = await loadLegacyWebAssets();
    if (legacy.length > 0) {
        await saveWebAssets(legacy);
    }
    return legacy;
}

async function saveWebAssets(assets) {
    setItem(
        webPortfolioKey,
        JSON.stringify({
            version: 1,
            pricesFetchedAt: Date.now(),
            assets: assets.map(assetToJson),
        }),
    );
}

export async function getAssets() {
    try {
        return await loadWebAssets();
    } catch {
        return [];
    }
}

export async function saveAssets(assets) {
    const validAssets = assets.filter(Boolean);
    await saveWebAssets(validAssets);
}

export async function getDreamMultiple() {
    const multiple = getItem(dreamMultipleKey);
    if (multiple == null || multiple === '') {
        return 1;
    }
    const value = Number(multiple);
    return Number.isFinite(value) ? value : 1;
}

export async function setDreamMultiple(multiple) {
    setItem(dreamMultipleKey, multiple.toString());
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
        2,
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
