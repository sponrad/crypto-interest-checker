import React, { useState, useMemo } from 'react';
import { Text, View, Image, Button,
         SafeAreaView, ScrollView,
         TouchableHighlight, TextInput} from 'react-native';
// https://min-api.cryptocompare.com/data/all/coinlist?summary=true
// dont open the file it crashes emacs, the above link is browser safe
import {coinData as externalCoinData} from './CoinData.jsx';
import { styles } from './styles.js';

export default function AddScreen({ navigation }) {
    const [text, onChangeText] = useState('');
    const [selected, onSetSelected] = useState(null);
    const [amount, onChangeAmount] = useState(null);
    const availableAssets = useMemo(
        () => {
            return Object.values(externalCoinData.Data)
                         .map(asset => {
                             return {
                                 symbol: asset.Symbol,
                                 name: asset.FullName,
                             };
                         });
        }
        ,[]
    )
    const filteredAssets = useMemo(
        () => availableAssets.filter(asset =>
            asset.name.toLowerCase().includes(text.toLowerCase())
        )
        ,[text]
    );
    return <SafeAreaView style={styles.container}>
      <TextInput onChangeText={onChangeText}
                 style={styles.input}
                 placeholder='Enter name or symbol...'
                 placeholderTextColor='#999'
                 autoFocus
                 value={text} />
      {!selected && !!text &&
       <ScrollView style={{margin: 10}}>
         {filteredAssets.map(asset => {
             return <TouchableHighlight onPress={() => onSetSelected(asset)}>
               <Text key={asset.symbol}
                     style={styles.text}>
                 {asset.name}
               </Text>
             </TouchableHighlight>
             ;
         })}
       </ScrollView>
      }
      {!!selected &&
       <View>
         <Text style={styles.text}>{selected.name}</Text>
         <Text style={styles.text}>Set the amount</Text>
         <TextInput
             style={styles.input}
             onChangeText={onChangeAmount}
             value={amount}
             placeholder="Set the amount"
             keyboardType="numeric"
         />
         <Button title="Save"
                 disabled={!selected || !amount}
                 onPress={() => console.log('saved')}
         />
       </View>
      }
    </SafeAreaView>;
}
