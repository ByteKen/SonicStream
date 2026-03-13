/**
 * RegisterScreen — Spotify-style sign-up with green accent and animations.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from '../../components/AppText';
import GlassCard from '../../components/GlassCard';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';

const RegisterScreen = ({ navigation }: any) => {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Entrance animation
  const formSlide = useRef(new Animated.Value(30)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in email and password.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      Alert.alert('Success', 'Account created! Check your email to confirm.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Animated.View
          style={{
            opacity: formOpacity,
            transform: [{ translateY: formSlide }],
          }}
        >
          <View style={styles.header}>
            <AppText variant="title">Create Account</AppText>
            <AppText variant="body" style={styles.tagline}>
              Start streaming for free
            </AppText>
          </View>

          <GlassCard style={styles.card}>
            <View style={styles.inputContainer}>
              <Icon name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Display name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password (min 6 characters)"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
              <View style={styles.registerButton}>
                {loading ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <AppText variant="subtitle" color={colors.textInverse}>
                    Create Account
                  </AppText>
                )}
              </View>
            </TouchableOpacity>
          </GlassCard>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <AppText variant="body" color={colors.textSecondary}>
              Already have an account?{' '}
            </AppText>
            <AppText variant="body" color={colors.primary}>
              Sign In
            </AppText>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  tagline: { marginTop: spacing.xs, textAlign: 'center' },
  card: { marginBottom: spacing.lg },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  inputIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.body,
  },
  registerButton: {
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
});

export default RegisterScreen;
