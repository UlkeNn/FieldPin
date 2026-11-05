import { Link, Stack } from 'expo-router';

import { Text, View } from 'react-native';



export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
            {"This screen doesn't exist."}
        </Text>
        <Link href="/" style={{ marginTop: 16 }}>
          <Text>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}