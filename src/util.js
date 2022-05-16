function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatCurrency(amount, showDecimals=true) {
    const fractionDigits = showDecimals ? 2 : 0;
    const rounded = Number(amount).toFixed(fractionDigits);
    return `\$${numberWithCommas(rounded)}`;
}
