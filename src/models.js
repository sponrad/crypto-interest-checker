function getAllFuncs(toCheck) {
    const props = [];
    let obj = toCheck;
    do {
        props.push(...Object.getOwnPropertyNames(obj));
    } while (obj = Object.getPrototypeOf(obj));

    return props.sort().filter((e, i, arr) => {
        if (e!=arr[i+1] && typeof toCheck[e] == 'function') return true;
    });
}

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
        this.interestAccounts = interestAccounts;
        this.price = 0;
    }

    getPrice(backend) {
        return backend.getSymbolPrice(this.symbol);
    }

    balance() {
        return this.quantity * this.price;
    }

    getImageUrl(backend) {
        if (!this.imageUrl) {
            backend.getImageUrl(this.symbol).then(
                url => this.imageUrl = url
            );
        }
        return this.imageUrl;
    }

    yearly() {
        if (this.interestAccounts.length > 0) {
            return this.interestAccounts.reduce(
                (prev, account) => {
                    return account.yearlyEarnings(this.price) + prev;
                }, 0
            );
        } else {
            return 0;
        }
    }

    setInterestRate(rate) {
        // this is the ghetto global version
        this.interestAccounts = [
            new InterestAccount(
                'Default',
                [{tier: Infinity, rate: rate}],
                this.quantity,
            ),
        ];
    }

    globalInterest() {
        let assetGlobalInterest = 0;
        if (this.interestAccounts.length > 0) {
            // this will get more complicated
            // since ill have to average the interest rate over the quantities
            // and make sure to only use the average for reads
            assetGlobalInterest = this.interestAccounts[0]
                                      .interestTiers[0]
                                      .rate;
        }
        return assetGlobalInterest;
    }
}

export class InterestAccount {
    constructor(name, interestTiers,  quantity) {
        this.name = name;
        // [{tier: X, rate: X}, {tier: X, rate: X},]
        // tier can be Infinity, which gets stringified as null
        // this needs to be an array to maintain order
        this.interestTiers = interestTiers.map(intTier => {
            return {
                tier: Number(intTier.tier) || Infinity,
                rate: Number(intTier.rate),
            };
        });
        this.quantity = Number(quantity);
    }

    yearlyEarnings(price) {
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
    const yearly = celEth.yearlyEarnings(2707.71);
    console.log(`12,467.06 should mostly match the calced yearly: ${yearly}`);
}
