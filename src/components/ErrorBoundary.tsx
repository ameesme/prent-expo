import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { COLORS, FONTS } from '../theme';

/**
 * Shows what went wrong instead of disappearing.
 *
 * A standalone build has no dev overlay, so an unhandled JS error takes the whole app down
 * to the Home Screen with nothing to go on. Catching it here turns that into a readable
 * message on screen, which is the difference between a reproducible bug report and a guess.
 *
 * Note this catches errors thrown while rendering React components. Crashes originating in
 * native modules or in a Reanimated worklet on the UI thread do not pass through here — if
 * the app still vanishes without this screen appearing, that itself narrows the cause.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[prent] render error', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: COLORS.ink, padding: 24 }}>
        <ScrollView contentContainerStyle={{ paddingTop: 72, paddingBottom: 48 }}>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: 13,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: COLORS.seal,
              marginBottom: 16,
            }}>
            Something broke
          </Text>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: 15,
              lineHeight: 22,
              color: COLORS.paper,
              marginBottom: 20,
            }}>
            {error.message || String(error)}
          </Text>
          {error.stack ? (
            <Text
              style={{
                fontFamily: FONTS.mono,
                fontSize: 11,
                lineHeight: 16,
                color: COLORS.sheetDesc,
              }}>
              {error.stack.split('\n').slice(0, 24).join('\n')}
            </Text>
          ) : null}
        </ScrollView>
      </View>
    );
  }
}
