import { coinDataBackend } from './coinDataBackend.js';

export class Asset {
    constructor(
        name,
        symbol,
        imageUrl=null,
        quantity=0,
        interestAccounts=[],
    ) {
        this.name = name;
        this.symbol = symbol;
        this.imageUrl = imageUrl;
        this.quantity = quantity;
        // tbd interest accounts
        this.interestAccounts = interestAccounts;
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

export class InterestAccount {
    constructor(name, interestTiers) {
        this.name = name;
        this.interestTiers = interestTiers;
    }
}
