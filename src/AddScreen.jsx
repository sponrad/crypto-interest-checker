import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, Image, Button,
         SafeAreaView, ScrollView,
         TouchableHighlight, TextInput} from 'react-native';
import { coinDataBackend } from  './coinDataBackend.js';
import { styles } from './styles.js';

export default function AddScreen({ navigation }) {
    const [text, onChangeText] = useState('');
    const [selected, onSetSelected] = useState(null);
    const [amount, onChangeAmount] = useState(null);
    const [availableAssets, setAvailableAssets] = useState([]);
    useEffect(() => {
        coinDataBackend.getTopAssets().then(setAvailableAssets);
    }, []);
    const filteredAssets = useMemo(
        () => availableAssets.filter(asset =>
            asset.name.toLowerCase().includes(text.toLowerCase())
        )
        ,[text, availableAssets]
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
