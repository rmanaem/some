import { useAuth } from 'app/provider/AuthProvider';
import { authStorage } from 'app/utils/authStorage';
import { useState } from 'react';
import { Button, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';

export default function AuthTestScreen() {
  const { user, loading, error, signIn, signUp, signOut } = useAuth();
  const [token, setToken] = useState<string | null>(null);
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
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: textColor }}>Auth Storage Test</Text>

      <Button
        title="Set token"
        onPress={async () => {
          await authStorage.setToken('test-token-123');
          setStatus('Token set');
        }}
      />
      <Button
        title="Get token"
        onPress={async () => {
          const t = await authStorage.getToken();
          setToken(t);
          setStatus('Token read');
        }}
      />
      <Button
        title="Remove token"
        onPress={async () => {
          await authStorage.removeToken();
          setToken(null);
          setStatus('Token removed');
        }}
      />

      <Text style={{ color: textColor }}>Current token: {token ?? '(none)'}</Text>
      <Text style={{ color: status ? textColor : subtle }}>Status: {status || '(idle)'}</Text>

      <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 12 }} />

      <Text style={{ fontSize: 18, fontWeight: 'bold', color: textColor }}>Auth Provider Test</Text>
      <Text style={{ color: textColor }}>loading: {String(loading)}</Text>
      <Text style={{ color: textColor }}>user: {user ? (user.email ?? user.id) : '(null)'}</Text>
      <Text style={{ color: error ? '#ff6b6b' : subtle }}>error: {error ?? '(none)'} </Text>

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
        title="Sign up"
        onPress={async () => {
          try {
            setStatus('Signing up...');
            await signUp(email, password);
            setStatus('Signed up');
          } catch (e) {
            console.error('Sign up error', e);
            setStatus('Sign up failed');
          }
        }}
        color={isDark ? '#4da3ff' : undefined}
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
      <Button
        title="Sign out"
        onPress={async () => {
          try {
            setStatus('Signing out...');
            await signOut();
            setStatus('Signed out');
          } catch (e) {
            console.error('Sign out error', e);
            setStatus('Sign out failed');
          }
        }}
        color={isDark ? '#4da3ff' : undefined}
      />
    </ScrollView>
  );
}
