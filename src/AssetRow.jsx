import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, Image, ActivityIndicator,
         RefreshControl, SafeAreaView, ScrollView, Button,
} from 'react-native';

import { styles } from './styles.js';
import { formatCurrency } from './util.js';
import AssetImage from './AssetImage.jsx';

export default function AssetRow(props) {
    return <View style={{
        flexDirection: 'row',
        alignContent: 'center',
        marginRight: 10,
    }}>
      <View style={{marginBottom: 15, marginRight: 10, marginLeft: 5}}>
        <AssetImage asset={props.asset} />
      </View>

      <View style={{flex: 1, alignItems: 'flex-start', flexDirect: 'column'}}>
        <View style={{}}>
          <Text style={styles.text}>
            {props.asset.name}
          </Text>
        </View>
        <View style={{}}>
          <Text style={{...styles.text, color: '#888'}}>
            {props.asset.quantity} | {formatCurrency(props.asset.price)}
          </Text>
        </View>
      </View>

      <View style={{flex: 1, alignItems: 'flex-end', flexDirect: 'column'}}>
        <View style={{}}>
          <Text style={{...styles.text, fontWeight: 'bold', color: 'green'}}>
            {formatCurrency(props.asset.balance(), false)}
          </Text>
        </View>
        <View style={{}}>
          <Text style={{...styles.text, color: '#888'}}>
            {formatCurrency(props.asset.balance() / 12, false)} / mo
          </Text>
        </View>
      </View>
    </View>;
}

AssetRow.propTypes = {
    asset: PropTypes.object.isRequired,
};
