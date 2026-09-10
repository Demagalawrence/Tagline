import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  keyboardAvoid?: boolean;
  contentContainerStyle?: object;
}

export function Screen({ children, scroll = false, keyboardAvoid = false, contentContainerStyle }: ScreenProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const safeStyle = { backgroundColor: colors.background };

  let content: ReactNode;
  if (scroll) {
    content = (
      <ScrollView
        contentContainerStyle={[{ padding: spacing.xl, paddingBottom: spacing['6xl'] }, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  } else {
    content = <View style={[styles.fill, contentContainerStyle]}>{children}</View>;
  }

  if (keyboardAvoid) {
    content = (
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 8}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView style={[styles.fill, safeStyle]} edges={['top', 'left', 'right']}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
