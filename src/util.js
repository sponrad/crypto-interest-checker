function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatCurrency(amount, showDecimals=true) {
    if (showDecimals) {
        return new Intl.NumberFormat(
            'en-US',
            {
                style: 'currency',
                currency: 'USD',
                currencySign: 'accounting'
            }
        ).format(amount)
    } else {
        return `\$${numberWithCommas(Math.round(amount))}`;
    }
}
