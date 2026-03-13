/**
 * OfflineBanner — thin bar at top when backend is unreachable.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from './AppText';
import { colors, spacing } from '../theme';
import { useNetwork } from '../hooks/useNetwork';

const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetwork();

  if (isOnline) return null;

  return (
    <View style={styles.container}>
      <Icon name="cloud-offline-outline" size={14} color={colors.warning} />
      <AppText variant="caption" color={colors.warning} style={styles.text}>
        You're offline — playing downloaded music only
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  text: { marginLeft: spacing.xs },
});

export default OfflineBanner;
