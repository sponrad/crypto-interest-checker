import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Image, ActivityIndicator,
         RefreshControl, SafeAreaView, ScrollView, Button,
         TouchableOpacity } from 'react-native';

import { coinDataBackend } from './coinDataBackend.js';
import { styles } from './styles.js';
import { formatCurrency } from './util.js';
import { getAssets, saveAssets } from './localStorage.js';
import AssetRow from './AssetRow.jsx';

export default function Home({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [holdings, setHoldings] = useState([]);

    async function refresh() {
        const assets = await getAssets();
        if (assets.length === 0) {
            setRefreshing(false);
            setLoading(false);
            setHoldings([]);
            return;
        }
        // TODO update any changed quantities before we wait for price refreshment
        coinDataBackend.getAssetsPrices(assets).then(prices => {
            setHoldings(
                assets.map(asset => {
                    asset.price = prices[asset.symbol];
                    return asset;
                })
            )
        }).finally(() => {
            setRefreshing(false);
            setLoading(false);
        });
    }
    function pullRefresh() {
        setRefreshing(true);
        refresh();
    }
    useEffect(refresh, []);
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refresh();
        });
        return unsubscribe;
    }, [navigation]);
    if (loading) {
        return <SafeAreaView style={styles.container}>
          <ActivityIndicator color='#ccc' size='large' />
        </SafeAreaView>;
    }
    const totalBalance = holdings.reduce((prev, curr) => prev + curr.balance(), 0);
    return <SafeAreaView style={styles.container}>

    {holdings.length > 0 &&
      <View style={{marginTop: 30, marginBottom: 30}}>
         <Text style={{...styles.text, fontSize: 40, fontWeight: 'bold'}}>
           {formatCurrency(totalBalance)}
         </Text>
         <Text style={{...styles.text, fontSize: 25, fontWeight: 'bold'}}>
           {formatCurrency(totalBalance / 12)} / mo
         </Text>
      </View>
    ||
     <View style={{
         margin: 30,
         flex: 1,
         alignContent: 'center',
         justifyContent: 'center',
     }}>
       {!refreshing &&
        <Text style={{
            ...styles.text,
            fontSize: 25,
            fontWeight: 'bold',
        }}>
          Click below to add some assets.
        </Text>
       }
     </View>
    }
      <ScrollView refreshControl={
          <RefreshControl refreshing={refreshing}
                          colors={['#ddd']}
                          tintColor="#ddd"
                          onRefresh={pullRefresh} />
      }>
        {holdings.map(holding => {
            return <TouchableOpacity key={holding.symbol}
                                     onPress={() => {
                                         navigation.navigate('Asset', {
                                             symbol: holding.symbol,
                                             price: holding.price,
                                         });
                                     }}>

              <AssetRow asset={holding} />
            </TouchableOpacity>;
        })}
      </ScrollView>
      <TouchableOpacity
          style={{
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              position: 'absolute',
              bottom: 30,
              right: 20,
              height: 60,
              backgroundColor: '#999',
              borderRadius: 30,
              flex: 1,
              flexDirection: 'row',
          }}
          onPress={() => {
              navigation.navigate('Add');
          }}>
        <Text style={{
            fontSize: 45,
            textAlign: 'center',
            paddingBottom: 7,
        }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>;
}
