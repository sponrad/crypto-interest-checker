// Assets are going to be serialized and stored locally
export class Asset {
    constructor(name, symbol, imageUrl=null, quantity=0) {
        this.name = name;
        this.symbol = symbol;
        this.imageUrl = imageUrl;
        this.quantity = quantity;
        // tbd interest accounts
        this.interestAccounts = [];
        this.price = 0;

        // make sure we have an imageUrl.. since its passed optionally
        this.getImageUrl();
    }

    getPrice() {
        return coinDataBackend.getSymbolPrice(this.symbol);
    }

    balance() {
        return this.quantity * this.price;
    }

    getImageUrl() {
        if (!this.imageUrl) {
            coinDataBackend.getImageUrl(this.symbol).then(
                url => this.imageUrl = url
            );
        }
        return this.imageUrl;
    }
}

const cryptoCompareBackend = {
    // https://min-api.cryptocompare.com/documentation
    getTopAssets: (page=0) => {
        const url = 'https://min-api.cryptocompare.com/data/top/mktcapfull?limit=100&tsym=USD';
        const baseImageUrl = 'https://www.cryptocompare.com/';
        return fetch(url)
            .then(res => res.json())
            .then(json => json.Data.map(assetData => {
                return new Asset(
                    assetData.CoinInfo.FullName,
                    assetData.CoinInfo.Internal,
                    `${baseImageUrl}${assetData.CoinInfo.ImageUrl}`
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
