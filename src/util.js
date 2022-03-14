export function formatCurrency(amount) {
    return new Intl.NumberFormat(
        'en-US',
        {
            style: 'currency',
            currency: 'USD',
            currencySign: 'accounting'
        }
    ).format(amount)
}
