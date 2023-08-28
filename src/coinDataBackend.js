import { Asset } from './models.js';

const cryptoCompareBackend = {
    // https://min-api.cryptocompare.com/documentation
    getTopAssets: (page=0) => {
        const url = `https://min-api.cryptocompare.com/data/top/mktcapfull?page=${page}&limit=100&tsym=USD`;
        const baseImageUrl = 'https://www.cryptocompare.com/';
        return fetch(url)
            .then(res => res.json())
            .then(json => json.Data.map(assetData => {
                return new Asset(
                    assetData.CoinInfo.FullName,
                    assetData.CoinInfo.Internal,
                    `${baseImageUrl}${assetData.CoinInfo.ImageUrl}`
                    // assetData.Display.MKTCAP.replace('$ ', '$'),
                );
            }));
    },
    getSymbolPrice: (symbol) => {
        // https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD
        const url = `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`;
        return fetch(url).then(res => res.json()).then(json => json.USD);
    },
    getAssetsPrices: (assets) => {
        // returns {symbol: price,}
        const fsyms = assets.map(asset => asset.symbol).join(',');
        const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${fsyms}&tsyms=USD`;
        return fetch(url).then(res => res.json()).then(json => {
            return Object.fromEntries(
                Object.entries(json).map(([symbol, usdprice]) => [symbol, usdprice.USD])
            );
        });
    },
    getImageUrl: (symbol) => {
        // https://min-api.cryptocompare.com/data/all/coinlist?fsym=ETH&summary=true
        const baseImageUrl = 'https://www.cryptocompare.com/';
        const url = `https://min-api.cryptocompare.com/data/all/coinlist?fsym=${symbol}&summary=true`;
        return fetch(url)
            .then(res => res.json())
            .then(json => {
                return `${baseImageUrl}${json.Data[symbol].ImageUrl}`;
            });
    },
};

export const coinDataBackend = cryptoCompareBackend;
