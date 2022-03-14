import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, Image, Button, ActivityIndicator,
         SafeAreaView, ScrollView,
         TouchableHighlight, TextInput} from 'react-native';
import { coinDataBackend } from  './coinDataBackend.js';
import { styles } from './styles.js';
import AssetImage from './AssetImage.jsx';

export default function AddScreen({ navigation }) {
    const [text, onChangeText] = useState('');
    const [selected, setSelected] = useState(null);
    const [amount, onChangeAmount] = useState(null);
    const [availableAssets, setAvailableAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setLoading(true);
        coinDataBackend.getTopAssets().then((assets) => {
            setAvailableAssets(assets);
            setLoading(false);
        });
    }, []);
    const filteredAssets = useMemo(
        () => availableAssets.filter(asset =>
            asset.name.toLowerCase().includes(text.toLowerCase())
        )
        ,[text, availableAssets]
    );
    return <SafeAreaView style={styles.container}>
      {!selected &&
       <View>
         <TextInput onChangeText={onChangeText}
                    style={styles.input}
                    placeholder='Filter name or symbol...'
                    placeholderTextColor='#999'
                    autoFocus
                    value={text} />
         {!!filteredAssets &&
          <ScrollView style={{margin: 10}}>
            {loading && <ActivityIndicator />}
            {filteredAssets.map(asset => {
                return <TouchableHighlight key={asset.symbol}
                                           onPress={() => setSelected(asset)}>
                  <View style={{
                      flexDirection: 'row',
                      alignContent: 'center',
                      alignItems: 'center',
                      marginBottom: 10,
                  }}>
                    <View style={{marginRight: 10}}>
                      <AssetImage asset={asset} />
                    </View>
                    <Text key={asset.symbol}
                          style={styles.text}>
                      {asset.name} ({asset.symbol})
                    </Text>
                  </View>
                </TouchableHighlight>
                ;
            })}
          </ScrollView>
         }
       </View>
      }
      {selected &&
       <View>
         <View style={{
             flexDirection: 'row',
             alignContent: 'center',
             alignItems: 'center',
             marginBottom: 10,
             marginTop: 20,
         }}>
           <View style={{marginRight: 10}}>
             <AssetImage asset={selected} />
           </View>
           <Text key={selected.symbol}
                 style={styles.text}>
             {selected.name} ({selected.symbol})
           </Text>
           <View style={{flex: 1, alignItems: 'flex-end'}}>
             <Button title="un-select"
                     onPress={() => setSelected(null)} />
           </View>
         </View>
         <TextInput
             style={styles.input}
             onChangeText={onChangeAmount}
             value={amount}
             placeholder="Set the amount"
             placeholderTextColor='#999'
             keyboardType="numeric"
             autoFocus
         />
         <Button title="Save"
                 disabled={!selected || !amount}
                 onPress={() => console.log('saved')}
         />
       </View>
      }
    </SafeAreaView>;
}
