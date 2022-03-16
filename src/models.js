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
        this.quantity = Number(quantity);
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

    yearly() {
        return this.interestAccounts.reduce(
            (account, prev) => account.yearly(this.price) + prev
            ,0
        );
    }
}

export class InterestAccount {
    constructor(name, interestTiers,  quantity) {
        this.name = name;
        // [{tier: X, rate: X}, {tier: X, rate: X},]
        // this needs to be an array to maintain order
        this.interestTiers = interestTiers;
        this.quantity = Number(quantity);
    }

    yearly(price) {
        // passing price in since that will come from the Asset
        let earnedAmount = 0.0;
        let unappliedQuantity = this.quantity;
        this.interestTiers.forEach(({rate, tier}) => {
            let appliedQuantity = 0;
            if (unappliedQuantity >= tier) {
                // full tier if unappliedAmount gte tier
                appliedQuantity = tier;
                unappliedQuantity -= tier;
            } else {
                // partial if unappliedAmount lt tier
                appliedQuantity = unappliedQuantity;
                unappliedQuantity = 0;
            }
            earnedAmount += appliedQuantity * price * rate / 100;
        });
        return earnedAmount;
    }
}

function testInterestAccountYearly() {
    let celEth = new InterestAccount(
        'test',
        [{tier: 30, rate: 5.35},{tier: Infinity, rate: 3.52}],
        115.207147,
    );
    const yearly = celEth.yearly(2707.71);
    console.log(`12,467.06 should mostly match the calced yearly: ${yearly}`);
}
