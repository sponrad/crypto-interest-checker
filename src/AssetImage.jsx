import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Image } from 'react-native';

export default function AssetImage(props) {
    const style = {
        width: 40,
        height: 40,
    };
    // check if we have the image in the local cache
    return <Image style={style}
                  source={{uri: props.asset.imageUrl}} />
}

AssetImage.propTypes = {
    asset: PropTypes.object,
};
