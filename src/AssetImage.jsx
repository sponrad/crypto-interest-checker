import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Image } from 'react-native';

import { coinDataBackend } from './coinDataBackend.js';

export default function AssetImage(props) {
    const style = {
        width: 40,
        height: 40,
    };
    return <Image style={style}
                  source={{
                      uri: props.asset.getImageUrl(coinDataBackend),
                  }} />
}

AssetImage.propTypes = {
    asset: PropTypes.object,
};
