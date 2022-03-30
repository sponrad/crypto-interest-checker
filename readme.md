### run locally
install everything and then

```
npm start
```

need to have the expo go app installed

### test device build

```
eas build --profile preview --platform ios
```

The build will have a QR code for install on any device that has previously done setup and installed the certificate:
```
eas device:create
```

### production build

```
eas build --platform ios
```
