import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, Button, ActivityIndicator,
         SafeAreaView, FlatList,
         TouchableHighlight, TextInput} from 'react-native';

import { coinDataBackend } from  './coinDataBackend.js';
import { styles } from './styles.js';
import AssetImage from './AssetImage.jsx';
import { getAssets, saveAssets } from './localStorage.js';

export default function AddScreen({ navigation }) {
    const [text, onChangeText] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [quantity, onChangeQuantity] = useState(null);
    const [availableAssets, setAvailableAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [loadedAll, setLoadedAll] = useState(false);
    function loadMore() {
        if (loading || loadedAll) {
            return;
        }
        setLoading(true);
        coinDataBackend.getTopAssets(page).then((assets) => {
            setPage(page + 1);
            // errors for any key collision so...
            // need to dedupe :/
            const currentSymbols = availableAssets.map(asset => asset.symbol);
            const dedupedAssets = assets.filter(
                asset => !currentSymbols.includes(asset.symbol)
            );
            setAvailableAssets(availableAssets.concat(dedupedAssets));
            if (assets.length === 0) {
                setLoadedAll(true);
            }
            setLoading(false);
        });
    }
    useEffect(loadMore, []);
    const filteredAssets = useMemo(
        () => availableAssets.filter(asset => {
            return asset.name.toLowerCase().includes(
                text.toLowerCase()
            ) || asset.symbol.toLowerCase() === text.toLowerCase();
        }),
        [text, availableAssets]
    );
    if (!loading
        && !loadedAll
        && !!text
        && filteredAssets.length === 0) {
        loadMore();
    }
    const renderItem = ({ item }) => {
        const asset = item;
        return <TouchableHighlight key={asset.symbol}
                                   onPress={() => setSelectedAsset(asset)}>
          <View style={{
              flexDirection: 'row',
              alignContent: 'center',
              alignItems: 'center',
              marginBottom: 10,
              marginLeft: 15,
              marginRight: 15,
          }}>
            <View style={{marginRight: 10}}>
              <AssetImage asset={asset} />
            </View>
            <Text key={asset.symbol}
                  style={styles.text}>
              {asset.name} ({asset.symbol})
            </Text>
          </View>
        </TouchableHighlight>;
    };
    return <SafeAreaView style={styles.container}>
      {!selectedAsset &&
       <View>
         <TextInput onChangeText={onChangeText}
                    style={{
                        ...styles.input,
                        marginRight: 15,
                        marginLeft: 15,
                    }}
                    placeholder='Filter name or symbol...'
                    placeholderTextColor='#999'
                    value={text} />
         {loading && <ActivityIndicator size="large"
                                        style={{marginTop: 12}}
                                        color="#eee" />}
         {loadedAll && filteredAssets.length === 0 &&
          <Text style={styles.text}>
            No results
          </Text>
         }
         {!!filteredAssets &&
          <FlatList style={{marginTop: 10}}
                    data={filteredAssets}
                    keyExtractor={(item) => item.symbol}
                    renderItem={renderItem} />
         }
       </View>
      }
      {selectedAsset &&
       <View style={{
           marginLeft: 15,
           marginRight: 15,
       }}>
         <View style={{
             flexDirection: 'row',
             alignContent: 'center',
             alignItems: 'center',
             marginBottom: 10,
             marginTop: 20,
         }}>
           <View style={{marginRight: 10}}>
             <AssetImage asset={selectedAsset} />
           </View>
           <Text key={selectedAsset.symbol}
                 style={styles.text}>
             {selectedAsset.name} ({selectedAsset.symbol})
           </Text>
           <View style={{flex: 1, alignItems: 'flex-end'}}>
             <Button title="un-select"
                     onPress={() => setSelectedAsset(null)} />
           </View>
         </View>
         <TextInput
             style={styles.input}
             onChangeText={onChangeQuantity}
             value={quantity}
             placeholder="Quantity"
             placeholderTextColor='#999'
             keyboardType="numeric"
             autoFocus
         />
         <Button title="Save"
                 disabled={!selectedAsset || !quantity}
                 onPress={async () => {
                     const assets = await getAssets();
                     const currentSymbols = assets.map(asset => asset.symbol);
                     if (currentSymbols.includes(selectedAsset.symbol)) {
                         const index = assets.findIndex(
                             asset => asset.symbol === selectedAsset.symbol
                         );
                         assets[index].quantity += Number(quantity);
                         saveAssets(assets);
                     } else {
                         selectedAsset.quantity = Number(quantity);
                         saveAssets(assets.concat([selectedAsset]));
                     }
                     navigation.navigate('Home');
           }}
         />
       </View>
      }
    </SafeAreaView>;
}
