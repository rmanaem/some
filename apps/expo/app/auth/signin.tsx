import { useAuth } from 'app/provider/AuthProvider';
import { useState } from 'react';
import { Button, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';

export default function AuthTestScreen() {
  const { signIn } = useAuth();
  const [status, setStatus] = useState<string>('');
  const [email, setEmail] = useState('demo@demo.com');
  const [password, setPassword] = useState('password-1234');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#fff' : '#111';
  const bgColor = isDark ? '#000' : '#fff';
  const subtle = isDark ? '#999' : '#666';
  const border = isDark ? '#444' : '#ccc';

  return (
    <ScrollView contentContainerStyle={{ padding: 24, rowGap: 12, backgroundColor: bgColor }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: textColor }}>
        Hello, sign in please
      </Text>
      <TextInput
        placeholder="email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={subtle}
        style={{
          borderWidth: 1,
          borderColor: border,
          padding: 8,
          borderRadius: 6,
          color: textColor,
          backgroundColor: isDark ? '#0d0d0d' : '#fafafa',
        }}
      />
      <TextInput
        placeholder="password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={subtle}
        style={{
          borderWidth: 1,
          borderColor: border,
          padding: 8,
          borderRadius: 6,
          color: textColor,
          backgroundColor: isDark ? '#0d0d0d' : '#fafafa',
        }}
      />
      <Button
        title="Sign in"
        onPress={async () => {
          try {
            setStatus('Signing in...');
            await signIn(email, password);
            setStatus('Signed in');
          } catch (e) {
            console.error('Sign in error', e);
            setStatus('Sign in failed');
          }
        }}
        color={isDark ? '#4da3ff' : undefined}
      />
      <Text style={{ color: status ? textColor : subtle }}>Status: {status || '(idle)'}</Text>
    </ScrollView>
  );
}
