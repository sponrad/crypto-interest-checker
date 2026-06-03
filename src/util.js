function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatCurrency(amount, showDecimals=true) {
    const value = Number(amount);
    if (!Number.isFinite(value)) {
        return '$0';
    }
    if (value < 1000000) {
        showDecimals = true;
    }
    const fractionDigits = showDecimals ? 2 : 0;
    const rounded = value.toFixed(fractionDigits);
    return `$${numberWithCommas(rounded)}`;
}

export function formatQuantity(qty) {
    const value = Number(qty);
    if (!Number.isFinite(value)) {
        return '0';
    }
    const abs = Math.abs(value);
    if (abs === 0) {
        return '0';
    }
    if (abs >= 1000) {
        return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    if (abs >= 1) {
        return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 6 });
}
