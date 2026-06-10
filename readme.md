# Crypto Checker with Interest

Expo SDK 54 app. Portfolio tracker with interest earnings and dream-mode price multipliers.

## Prerequisites

- Node.js **≥ 20.19.4** (LTS recommended)
- [EAS CLI](https://docs.expo.dev/build/setup/): `npm install -g eas-cli`
- Expo account: `eas login`

## Run locally

```bash
npm install
npm start
```

Scan the QR code in **Expo Go** on your phone (App Store version supports SDK 54), or press `i` for the iOS simulator.

## Test on a physical device (internal build)

Register devices once:

```bash
eas device:create
```

Build and install:

```bash
eas build --profile preview --platform ios
```

Use the QR code / install link from the EAS dashboard when the build finishes.

## Production build & store submit

Version numbers live in `app.json`:

- `expo.version` — user-facing version (e.g. `1.0.6`)
- `expo.ios.buildNumber` — must increase for each App Store upload
- `expo.android.versionCode` — must increase for each Play Store upload

Build for both stores:

```bash
eas build --profile production --platform all
```

Submit after builds succeed:

```bash
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

- **iOS** — EAS prompts for Apple credentials if not already saved. Bundle ID: `com.sponrad.cryptointerestchecker`
- **Android** — uses the Play Console service account configured in `eas.json` (`submit.production.android.serviceAccountKeyPath`)

To submit a specific build:

```bash
eas submit --profile production --platform ios --latest
eas submit --profile production --platform android --latest
```

## Store checklist

**Apple App Store Connect**

- Updated screenshots if required (6.5" iPhone, 5.5" iPhone, 12.9" iPad)
- App Privacy / data collection questionnaire
- Release notes ("What's New")

**Google Play Console**

- Data safety form
- Release notes

## Useful commands

```bash
npx expo-doctor          # verify dependency compatibility
eas build:list           # recent builds
eas submit:list          # recent submissions
```
