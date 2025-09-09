import { YStack } from '@my/ui';
import { SupabaseTest } from '../../components/SupabaseTest';

export function HomeScreen() {
  return (
    <YStack flex={1}>
      <SupabaseTest />
    </YStack>
  );
}
