import { Asset } from './models.js';

// https://docs.coingecko.com/reference/introduction
const BASE_URL = 'https://api.coingecko.com/api/v3';

async function fetchJson(url, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
            throw new Error(`CoinGecko API error: ${res.status}`);
        }
        return res.json();
    } finally {
        clearTimeout(timeout);
    }
}

const coinGeckoBackend = {
    getTopAssets: (page = 0) => {
        const url = `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page + 1}&sparkline=false`;
        return fetchJson(url).then((coins) =>
            coins.map(
                (coin) =>
                    new Asset(
                        coin.name,
                        coin.symbol.toUpperCase(),
                        coin.image,
                        0,
                        [],
                        coin.id
                    )
            )
        );
    },
    getSymbolPrice: (symbol) => {
        const url = `${BASE_URL}/simple/price?symbols=${symbol.toLowerCase()}&vs_currencies=usd`;
        return fetchJson(url).then((json) => json[symbol.toLowerCase()]?.usd);
    },
    getAssetsPrices: (assets) => {
        const withIds = assets.filter((asset) => asset.coinId);
        const withoutIds = assets.filter((asset) => !asset.coinId);
        const promises = [];

        if (withIds.length > 0) {
            const ids = withIds.map((asset) => asset.coinId).join(',');
            promises.push(
                fetchJson(`${BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd`).then(
                    (json) => {
                        const prices = {};
                        withIds.forEach((asset) => {
                            prices[asset.symbol] = json[asset.coinId]?.usd;
                        });
                        return prices;
                    }
                )
            );
        }

        if (withoutIds.length > 0) {
            const symbols = withoutIds.map((asset) => asset.symbol.toLowerCase()).join(',');
            promises.push(
                fetchJson(`${BASE_URL}/simple/price?symbols=${symbols}&vs_currencies=usd`).then(
                    (json) => {
                        const prices = {};
                        withoutIds.forEach((asset) => {
                            prices[asset.symbol] = json[asset.symbol.toLowerCase()]?.usd;
                        });
                        return prices;
                    }
                )
            );
        }

        return Promise.all(promises).then((results) => Object.assign({}, ...results));
    },
    getImageUrl: (symbol, coinId = null) => {
        if (coinId) {
            const url = `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`;
            return fetchJson(url).then((json) => json.image?.small || json.image?.large);
        }
        const url = `${BASE_URL}/search?query=${encodeURIComponent(symbol)}`;
        return fetchJson(url).then((json) => {
            const match =
                json.coins?.find(
                    (coin) => coin.symbol.toUpperCase() === symbol.toUpperCase()
                ) || json.coins?.[0];
            return match?.large || match?.thumb;
        });
    },
};

export const coinDataBackend = coinGeckoBackend;
