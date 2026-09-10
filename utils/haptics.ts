import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export async function successHaptic(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function warningHaptic(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export async function errorHaptic(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export async function lightHaptic(): Promise<void> {
  if (Platform.OS === 'android') {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return;
  }
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function mediumHaptic(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function selectionHaptic(): Promise<void> {
  await Haptics.selectionAsync();
}
