import React from 'react';
import PropTypes from 'prop-types';
import { Text, View } from 'react-native';

import { styles } from './styles.js';
import { formatCurrency, formatQuantity } from './util.js';
import AssetImage from './AssetImage.jsx';

export default function AssetRow({ asset, isActive, embedded }) {
    const meta = `${formatQuantity(asset.quantity)} @ ${formatCurrency(asset.price)}`;

    const rowStyle = embedded
        ? styles.holdingRowEmbedded
        : [styles.holdingRow, isActive && styles.holdingRowActive];

    return (
        <View style={rowStyle}>
            <AssetImage asset={asset} />
            <View style={styles.holdingMain}>
                <Text style={styles.holdingName} numberOfLines={1} ellipsizeMode="tail">
                    {asset.name}
                </Text>
                <Text style={styles.holdingMeta} numberOfLines={1} ellipsizeMode="middle">
                    {meta}
                </Text>
            </View>
            <View style={styles.holdingValues}>
                <Text
                    style={styles.holdingBalance}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                >
                    {formatCurrency(asset.balance(), false)}
                </Text>
                <Text
                    style={styles.holdingInterest}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                >
                    {formatCurrency(asset.yearly() / 12, false)} / mo
                </Text>
            </View>
        </View>
    );
}

AssetRow.propTypes = {
    asset: PropTypes.object.isRequired,
    isActive: PropTypes.bool,
    embedded: PropTypes.bool,
};
