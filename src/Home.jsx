import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Image,
         RefreshControl, SafeAreaView, ScrollView,
         TouchableOpacity } from 'react-native';
// https://min-api.cryptocompare.com/data/all/coinlist?summary=true
// dont open the file it crashes emacs, the above link is browser safe
import {coinData as externalCoinData} from './CoinData.jsx';
import { styles } from './styles.js';

const coinData = [
    {'name': 'Bitcoin',
     'pricef': (r) => r['USD'],
     'tsym': 'USD',
     'amt': '100'},
    {'name': 'Ether',
     'pricef': r => r['USD'] / r['ETH'],
     'tsym': 'ETH',
     'amt': '100'},
    {'name': 'Bitcoin Cash',
     'pricef': r => r['USD'] / r['BCH'],
     'tsym': 'BCH',
     'amt': '100'},
    {'name': 'Nano',
     'pricef': r => r['USD'] / r['NANO'],
     'tsym': 'NANO',
     'amt': '100'},
    {'name': 'Lumen',
     'pricef': r => r['USD'] / r['XLM'],
     'tsym': 'XLM',
     'amt': '100'},
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

const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

export default function Home({ navigation }) {
    const [refreshing, setRefreshing] = useState(false);
    const [holdings, setHoldings] = useState([]);

    function refresh() {
        setRefreshing(true);
        const tSymbols = coinData.map(cd => cd.tsym).join(',');
        const url = `https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=${tSymbols}`;
        fetch(url)
            .then(res => res.json())
            .then(json => {
                setHoldings(
                    coinData.map(cd => {
                        cd.price = cd.pricef(json);
                        cd.balance = cd.price * cd.amt;
                        const tsym = cd.tsym === 'USD' ? 'BTC' : cd.tsym;
                        cd.externalData = externalCoinData.Data[tsym];
                        return cd;
                    })
                );
            })
            .finally(() => setRefreshing(false));
    }
    useEffect(refresh, []);

    const totalBalance = holdings.reduce((prev, curr) => prev + curr.balance, 0);
    const baseImageUrl = 'https://www.cryptocompare.com/';
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
            return <View key={holding.name} style={{
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
                           uri: `${baseImageUrl}${holding.externalData.ImageUrl}`,
                       }} />
              </View>

              <View style={{flex: 1, alignItems: 'flex-start', flexDirect: 'column'}}>
                <View style={{}}>
                  <Text style={styles.text}>
                    {holding.externalData.FullName}
                  </Text>
                </View>
                <View style={{}}>
                  <Text style={{...styles.text, color: '#888'}}>
                    {holding.amt} | {formatCurrency(holding.price)}
                  </Text>
                </View>
              </View>

              <View style={{flex: 1, alignItems: 'flex-end', flexDirect: 'column'}}>
                <View style={{}}>
                  <Text style={{...styles.text, fontWeight: 'bold', color: 'green'}}>
                    {formatCurrency(holding.balance)}
                  </Text>
                </View>
                <View style={{}}>
                  <Text style={{...styles.text, color: '#888'}}>
                    {formatCurrency(holding.balance / 12)} / mo
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
