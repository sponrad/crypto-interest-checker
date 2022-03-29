import * as SecureStore from 'expo-secure-store';
import { Asset, InterestAccount } from './models.js';

async function save(key, value) {
    await SecureStore.setItemAsync(key, value);
}

async function getValueFor(key) {
    let result = await SecureStore.getItemAsync(key);
    if (!result) {
        return null;
    }
    return result;
}

const assetsKey = 'local-storage-asset-key';

export async function getAssets() {
    const assetsData = await getValueFor(assetsKey);
    if (!assetsData) {
        return [];
    }
    return JSON.parse(assetsData)
               .map(json => {
                   return new Asset(
                       json.name,
                       json.symbol,
                       json.imageUrl,
                       json.quantity,
                       json.interestAccounts.map(
                           ia => {
                               return new InterestAccount(
                                   ia.name,
                                   ia.interestTiers,
                                   ia.quantity,
                               );
                           }
                       ),
                   );
               });
}

export function saveAssets(assets) {
    save(assetsKey,
         JSON.stringify(assets.map(asset => {
             return {
                 name: asset.name,
                 symbol: asset.symbol,
                 imageUrl: asset.imageUrl,
                 quantity: asset.quantity,
                 interestAccounts: asset.interestAccounts.map(
                     ia => {
                         return {
                             name: ia.name,
                             interestTiers: ia.interestTiers,
                             quantity: ia.quantity,
                         };
                     }
                 ),
             };
         }))
    );
}
