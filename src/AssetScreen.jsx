import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, Button, SafeAreaView,
         TextInput} from 'react-native';

import { styles } from './styles.js';
import { getAssets, saveAssets } from './localStorage.js';
import { formatCurrency } from './util.js';
import AssetRow from './AssetRow.jsx';

export default function AssetScreen({ route, navigation }) {
    const { symbol, price } = route.params;
    const [asset, setAsset] = useState(null);
    const [editQuantity, setEditQuantity] = useState(false);
    const [quantity, setQuantity] = useState(null);

    useEffect(async () => {
        const assets = await getAssets();
        const theAsset = assets.find(asset => asset.symbol === symbol);
        navigation.setOptions({
            title: theAsset.symbol,
        });
        theAsset.price = price;
        setAsset(theAsset);
        setQuantity(theAsset.quantity.toString());
    }, []);

    if (!asset) {
        return null;
    }

    async function onSaveQuantity() {
        const assets = await getAssets();
        const index = assets.findIndex(
            asset => asset.symbol === symbol
        );
        assets[index].quantity = Number(quantity);
        assets[index].price = asset.price;
        saveAssets(assets);
        setAsset(assets[index]);
        setEditQuantity(false);
    }

    async function onRemove() {
        const assets = await getAssets();
        saveAssets(assets.filter(asset => asset.symbol !== symbol));
        navigation.pop();
    }

    return <SafeAreaView style={{
        ...styles.container,
        alignItems: 'flext-start',
        marginTop: 15,
    }}>
      <AssetRow asset={asset} />
      <Button title={editQuantity ? 'Cancel edit' : 'Edit quantity'}
              onPress={() => setEditQuantity(!editQuantity)} />
      {editQuantity &&
       <View style={{
           flexDirection: 'row',
           alignItems: 'center',
           marginTop: 20,
       }}>
           <View style={{flex: 4}}>
             <TextInput
                 style={styles.input}
                 onChangeText={setQuantity}
                 value={quantity}
                 placeholder="New quantity"
                 placeholderTextColor='#999'
                 keyboardType="numeric"
                 autoFocus
             />
           </View>
           <View style={{flex: 3}}>
             <Button title="Save"
                     disabled={!quantity}
                     onPress={onSaveQuantity}
             />
           </View>
         </View>
      }
      {editQuantity &&
       <View style={{flexDirection: 'row', marginTop: 20}}>
         <View style={{flex: 1}}>
           <Button title={`Remove ${asset.name}`}
                   color="red"
                   onPress={onRemove} />
         </View>
       </View>
      }
      <Button title="Add interest account"
              onPress={() => console.log("add interest account")} />
      <View style={{marginTop: 15}}>
        <Text style={styles.text}>Interest accounts here</Text>
      </View>

    </SafeAreaView>;
}
