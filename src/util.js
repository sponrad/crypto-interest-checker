function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatCurrency(amount, showDecimals=true) {
    if (amount < 1000000) {
        // always show decimals for smaller amounts...
        showDecimals = true;
    }
    const fractionDigits = showDecimals ? 2 : 0;
    const rounded = Number(amount).toFixed(fractionDigits);
    return `\$${numberWithCommas(rounded)}`;
}
