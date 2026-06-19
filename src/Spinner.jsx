import React from 'react';
import PropTypes from 'prop-types';

export default function Spinner({ small }) {
    return <div className={small ? 'spinner spinner--small' : 'spinner'} aria-hidden="true" />;
}

Spinner.propTypes = {
    small: PropTypes.bool,
};
