import React, { useState, useEffect } from 'react';
import { Text, View, Button, ActivityIndicator,
         SafeAreaView, TouchableHighlight, TextInput} from 'react-native';

import { styles } from './styles.js';
import { getDreamMultiple, setDreamMultiple } from './localStorage.js';

export default function SettingsScreen({ navigation }) {
    const [multiple, setMultiple] = useState('1');
    useEffect(() => {
        getDreamMultiple().then(multiple => {
            if (multiple) {
                setMultiple(multiple.toString());
            }
        });
    }, []);
    function updateDreamMultiple(val) {
        setMultiple(val);
        setDreamMultiple(val);
    }

    function dreamAndLeave(val) {
        updateDreamMultiple(val);
        navigation.navigate('Home');
    }

    return <SafeAreaView style={styles.container}>
      <View style={styles.settingSection}>
        <Text style={{...styles.text, textAlign: 'left', fontWeight: 'bold'}}>
          {(!multiple || multiple >= 1) && 'Dream' || 'Nightmare'} Mode
        </Text>
        <Text style={{...styles.text, textAlign: 'left'}}>
          Multiply asset prices to see how your portfolio will perform as the
          market changes. Only affects the main screen right now.
        </Text>
        {['0.5', '2', '4', '8', '10', '15', '20'].map(dream => {
            return <Button title={`${dream}x`}
                           key={dream}
                           onPress={() => dreamAndLeave(dream)} />;
        })}
        {Number(multiple) != 1 &&
         <Button title="reset" onPress={() => dreamAndLeave('1')} />
        }

        <View style={{
            flexDirection: 'row',
            textAlign: 'center',
            marginLeft: 'auto',
            marginRight: 'auto',
        }}>
          <Text style={{...styles.text, marginTop: 20, marginRight: 20}}>
            Custom
          </Text>
          <TextInput
              style={{
                  ...styles.input,
                  width: 100,
                  textAlign: 'center',
              }}
              value={multiple}
              onChangeText={updateDreamMultiple}
              placeholder='Custom 1, 10, 0.5'
              placeholderTextColor='#999'
              keyboardType="numeric"
          />
        </View>

      </View>

      <View style={styles.settingSection}>
        <Text style={{...styles.text, textAlign: 'left', fontWeight: 'bold'}}>
          About
        </Text>
        <Text style={{...styles.text, textAlign: 'left'}}>
          Crypto Checker with Interest by Conrad Frame.
        </Text>
        <Text style={{...styles.text, textAlign: 'left'}}>
          Email <Text selectable>conrad@devlabtech.com</Text> for support.
        </Text>
      </View>
    </SafeAreaView>;
}
