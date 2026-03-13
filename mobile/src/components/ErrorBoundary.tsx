/**
 * ErrorBoundary — catches render errors and shows a recovery screen.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from './AppText';
import { colors, spacing, borderRadius } from '../theme';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <LinearGradient colors={['#0A0A0F', '#1a1a2e']} style={styles.container}>
          <View style={styles.iconBg}>
            <Icon name="warning-outline" size={48} color={colors.warning} />
          </View>
          <AppText variant="title" style={styles.title}>
            Something went wrong
          </AppText>
          <AppText variant="body" style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </AppText>
          <TouchableOpacity onPress={this.handleReset} activeOpacity={0.8}>
            <LinearGradient
              colors={colors.gradientPrimary as [string, string]}
              style={styles.button}
            >
              <AppText variant="subtitle" color="#FFF">
                Try Again
              </AppText>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { marginBottom: spacing.sm, textAlign: 'center' },
  message: { marginBottom: spacing.xl, textAlign: 'center' },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
});

export default ErrorBoundary;
