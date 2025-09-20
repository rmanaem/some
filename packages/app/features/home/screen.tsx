import { YStack } from '@my/ui';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { SupabaseTest } from '../../components/SupabaseTest';

export function HomeScreen() {
  const [showTest, setShowTest] = useState(false);

  return (
    <YStack flex={1}>
      <Link href="/dev/auth-test">
        <Text style={{ padding: 12, color: 'blue' }}>Open Auth Test</Text>
      </Link>
      <Link href="/auth/signin">
        <Text style={{ padding: 12, color: 'white' }}>Open sign in screen</Text>
      </Link>

      <Text style={{ padding: 12, color: 'red' }} onPress={() => setShowTest((v) => !v)}>
        {showTest ? 'Close' : 'Open'} Supabase Test
      </Text>
      {showTest && <SupabaseTest />}
    </YStack>
  );
}
