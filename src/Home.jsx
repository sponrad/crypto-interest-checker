import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Image,
         RefreshControl, SafeAreaView, ScrollView,
         TouchableOpacity } from 'react-native';
import { coinDataBackend, Asset } from './coinDataBackend.js';
import { styles } from './styles.js';

const assets = [
    new Asset('Bitcoin', 'BTC', null, 100),
    new Asset('Ethereum', 'ETH', null, 100),
    new Asset('Bitcoin Cash', 'BCH', null, 100),
    new Asset('Nano', 'NANO', null, 100),
    new Asset('Lumen', 'XLM', null, 100),
];

function formatCurrency(amount) {
    return new Intl.NumberFormat(
        'en-US',
        {
            style: 'currency',
            currency: 'USD',
            currencySign: 'accounting'
        }
    ).format(amount)
}

export default function Home({ navigation }) {
    const [refreshing, setRefreshing] = useState(false);
    const [holdings, setHoldings] = useState([]);

    function refresh() {
        setRefreshing(true);
        coinDataBackend.getAssetsPrices(assets).then(prices => {
            setHoldings(
                assets.map(asset => {
                    asset.price = prices[asset.symbol];
                    return asset;
                })
            )
        }).finally(() => setRefreshing(false));
    }
    useEffect(refresh, []);

    const totalBalance = holdings.reduce((prev, curr) => prev + curr.balance(), 0);
    return <SafeAreaView style={styles.container}>

      <View style={{marginTop: 30, marginBottom: 30}}>
        <Text style={{...styles.text, fontSize: 40, fontWeight: 'bold'}}>
          {formatCurrency(totalBalance)}
        </Text>
        <Text style={{...styles.text, fontSize: 25, fontWeight: 'bold'}}>
          {formatCurrency(totalBalance / 12)} / mo
        </Text>
      </View>

      <ScrollView style={{margin: 10}}
                  refreshControl={
          <RefreshControl refreshing={refreshing}
                          colors={['#ddd']}
                          tintColor="#ddd"
                          onRefresh={refresh} />
      }>
        {holdings.map(holding => {
            return <View key={holding.symbol} style={{
                flexDirection: 'row',
                alignContent: 'center',
            }}>
              <View style={{marginBottom: 10}}>
                <Image style={{
                    ...styles.logo,
                    marginRight: 10,
                    marginLeft: 5,
                }}
                       source={{
                           uri: holding.imageUrl,
                       }} />
              </View>

              <View style={{flex: 1, alignItems: 'flex-start', flexDirect: 'column'}}>
                <View style={{}}>
                  <Text style={styles.text}>
                    {holding.name}
                  </Text>
                </View>
                <View style={{}}>
                  <Text style={{...styles.text, color: '#888'}}>
                    {holding.quantity} | {formatCurrency(holding.price)}
                  </Text>
                </View>
              </View>

              <View style={{flex: 1, alignItems: 'flex-end', flexDirect: 'column'}}>
                <View style={{}}>
                  <Text style={{...styles.text, fontWeight: 'bold', color: 'green'}}>
                    {formatCurrency(holding.balance())}
                  </Text>
                </View>
                <View style={{}}>
                  <Text style={{...styles.text, color: '#888'}}>
                    {formatCurrency(holding.balance() / 12)} / mo
                  </Text>
                </View>
              </View>
            </View>
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
