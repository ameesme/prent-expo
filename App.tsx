// Deep imports on purpose: the package roots re-export every weight and italic,
// which would drag ~5MB of unused TTFs into the bundle.
import { Caveat_400Regular } from '@expo-google-fonts/caveat/400Regular';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono/400Regular';
import { useFonts } from 'expo-font';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CaptureScreen } from './src/screens/CaptureScreen';
import { COLORS } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceMono_400Regular,
    Inter_400Regular,
    Caveat_400Regular,
  });

  // The prototype ships a full landscape layout, so both orientations stay available.
  useEffect(() => {
    ScreenOrientation.unlockAsync().catch(() => {
      /* not supported on this device — keep the manifest orientation */
    });
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.paper }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CaptureScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
