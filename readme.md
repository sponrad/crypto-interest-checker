### run locally
install everything and then

```
npm start
```

need to have the expo go app installed

or can do an ios emulator with `i` or `shift + i`

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
eas build --platform all
eas submit -p ios
```

Android currently needs to be copied over to the playstore console manually.


iOS needs screenshots for:
6.5" 11 pro max
5.5" 8 plus
12.9" ipad pro 
