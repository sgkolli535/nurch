import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { LoadingPulse } from '../../src/components/ui/LoadingPulse';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { register } from '../../src/services/auth';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email, password, displayName || undefined);
      router.replace('/(auth)/onboarding');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="handwritten" color={colors.terracotta}>
            join the garden
          </Text>
          <Text variant="heading1" color={colors.soil}>
            Create Account
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingPulse size={60} />
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How should we call you?"
              autoComplete="name"
              containerStyle={styles.inputContainer}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              containerStyle={styles.inputContainer}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder="At least 8 characters"
              containerStyle={styles.inputContainer}
              error={error || undefined}
            />
            <Button variant="primary" onPress={handleRegister}>
              Create Account
            </Button>
            <Pressable onPress={() => router.back()} style={styles.link}>
              <Text variant="body" color={colors.sage}>
                Already have an account? Sign in
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.linen,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  form: {
    gap: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.xs,
  },
  link: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
});
