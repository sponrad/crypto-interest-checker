import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Image, ActivityIndicator,
         RefreshControl, SafeAreaView, Button,
         TouchableOpacity, Platform } from 'react-native';
import DraggableFlatList, {
    ScaleDecorator,
} from "react-native-draggable-flatlist";
import Ionicons from '@expo/vector-icons/Ionicons';

import { coinDataBackend } from './coinDataBackend.js';
import { styles } from './styles.js';
import { formatCurrency } from './util.js';
import { getAssets, saveAssets, getDreamMultiple } from './localStorage.js';
import AssetRow from './AssetRow.jsx';

export default function Home({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [holdings, setHoldings] = useState([]);
    const [multiple, setMultiple] = useState(1);

    async function refresh() {
        const theMultiple = await getDreamMultiple() || 1;
        setMultiple(theMultiple);
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
                    asset.price = prices[asset.symbol] * theMultiple;
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
    useEffect(() => {
        refresh();
    }, []);
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
    const totalInterest = holdings.reduce((prev, curr) => prev + curr.yearly(), 0);

    return <SafeAreaView style={styles.container}>
      <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginLeft: 5,
          marginRight: 5,
          marginTop: 0,
          marginBottom: 0,
          padding: 0,
      }}>
        <TouchableOpacity onPress={() => {
            navigation.navigate('Settings');
        }}>
          <Ionicons name="menu" size={40} color="#ddd" />
        </TouchableOpacity>
        {/*
            <Image style={{width: 40, height: 40}} source={require('../assets/icon.png')} />
          */}
        <TouchableOpacity onPress={() => {
            navigation.navigate('Add');
        }}>
          <Ionicons name="add-circle-outline" size={40} color="#ddd" />
        </TouchableOpacity>
      </View>
      {multiple !== 1 &&
       <TouchableOpacity onPress={() => {
           navigation.navigate('Settings');
       }}>
         <Text style={{
             ...styles.text,
             fontSize: 20,
             fontWeight: 'bold',
             color: multiple >= 1 ? 'green' : 'red',
         }}>
           Prices multiplied {multiple}x
         </Text>
       </TouchableOpacity>
      }
      {holdings.length > 0 &&
       <View style={{marginTop: 10, marginBottom: 20}}>
         <Text style={{...styles.text, fontSize: 40, fontWeight: 'bold'}}>
           {formatCurrency(totalBalance, false)}
         </Text>
         <Text style={{...styles.text, fontSize: 25, fontWeight: 'bold'}}>
           {formatCurrency(totalInterest / 12, false)} / mo
         </Text>
       </View>
      ||
       <View style={{
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
      <DraggableFlatList
          data={holdings}
          ListFooterComponent={
              <View style={{height: 100}} />
          }
          onDragEnd={({ data }) => {
              setHoldings(data);
              // also change the order using saveAssets
              getAssets().then(assets => {
                  saveAssets(
                      data.map(holding => assets.find(
                          asset => asset.symbol === holding.symbol)
                      )
                  );
              });
          }}
          keyExtractor={(holding) => holding.symbol}
          refreshControl={
              <RefreshControl refreshing={refreshing}
                              colors={['#ddd']}
                              tintColor="#ddd"
                              onRefresh={pullRefresh} />
          }
          renderItem={({ item, drag, isActive }: RenderItemParams<Item>) => {
              const holding = item;
              if (!holding) {
                  return null;
              }
              return <ScaleDecorator key={holding.symbol}>
                <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    onPress={() => {
                        navigation.navigate('Asset', {
                            symbol: holding.symbol,
                            price: holding.price,
                        });
                    }}>
                  <AssetRow asset={holding} />
                </TouchableOpacity>
              </ScaleDecorator>;
          }} />
    </SafeAreaView>;
}
