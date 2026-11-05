# FieldPin Mobile

Mobile app for field technicians, built with Expo (React Native, TypeScript).
Technicians sign in, see the service requests (talepler) assigned to them, create work orders with
photos, QR / plate scanning and location, and browse their work order history.
It talks to the FieldPin backend API.

## Requirements

- Node.js 20+
- A running FieldPin backend reachable from your phone (same Wi-Fi network)
- Expo Go on your phone, or an Android / iOS simulator

## Getting started

```bash
npm install
cp .env.example .env   # then set EXPO_PUBLIC_BASE_URL to your backend's LAN address
npx expo start
```

Scan the QR code with Expo Go, or press `a` / `i` to open a simulator.

## Useful commands

```bash
npx tsc --noEmit       # type-check
npm run lint           # eslint + prettier check
```

## License

[MIT](../LICENSE)
