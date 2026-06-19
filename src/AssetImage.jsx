import React from 'react';
import PropTypes from 'prop-types';

import { coinDataBackend } from './coinDataBackend.js';

export default function AssetImage({ asset }) {
    return (
        <img
            className="asset-image"
            src={asset.getImageUrl(coinDataBackend)}
            alt=""
            width={40}
            height={40}
            style={{ borderRadius: '50%', flexShrink: 0 }}
        />
    );
}

AssetImage.propTypes = {
    asset: PropTypes.object,
};
