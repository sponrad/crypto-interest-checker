import React from 'react';
import PropTypes from 'prop-types';

import { formatCurrency, formatQuantity } from './util.js';
import AssetImage from './AssetImage.jsx';

export default function AssetRow({ asset, isActive, embedded, dragging }) {
    const meta = `${formatQuantity(asset.quantity)} @ ${formatCurrency(asset.price)}`;

    const rowClass = embedded
        ? 'holding-row holding-row--embedded'
        : [
              'holding-row',
              isActive && 'holding-row--active',
              dragging && 'holding-row--dragging',
          ]
              .filter(Boolean)
              .join(' ');

    return (
        <div className={rowClass}>
            <AssetImage asset={asset} />
            <div className="holding-main">
                <div className="holding-name">{asset.name}</div>
                <div className="holding-meta">{meta}</div>
            </div>
            <div className="holding-values">
                <div className="holding-balance">{formatCurrency(asset.balance(), false)}</div>
                <div className="holding-interest">
                    {formatCurrency(asset.yearly() / 12, false)} / mo
                </div>
            </div>
        </div>
    );
}

AssetRow.propTypes = {
    asset: PropTypes.object.isRequired,
    isActive: PropTypes.bool,
    embedded: PropTypes.bool,
    dragging: PropTypes.bool,
};
