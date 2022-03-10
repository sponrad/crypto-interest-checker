import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image,
         RefreshControl, SafeAreaView, ScrollView } from 'react-native';
// https://min-api.cryptocompare.com/data/all/coinlist?summary=true
// dont open the file it crashes emacs
import {coinData as externalCoinData} from './CoinData.jsx';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        padding: 5,
    },
    text: {
        color: '#ddd',
        textAlign: 'center',
        fontSize: 16,
    },
    logo: {
        width: 40,
        height: 40,
    },
});

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

export default function Home() {
    const [refreshing, setRefreshing] = useState(false);
    const [holdings, setHoldings] = useState([]);

    function refresh() {
        setRefreshing(true);
        console.log('calling refresh');
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
                        console.log(cd);
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

      <ScrollView refreshControl={
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

              <View style={{flex: 1, alignItems: 'flex-end', alignContent: 'space-around'}}>
                <Text style={{...styles.text, fontWeight: 'bold', color: 'green'}}>
                  {formatCurrency(holding.balance)}
                </Text>
              </View>
            </View>
        })}
      </ScrollView>
    </SafeAreaView>;
}
