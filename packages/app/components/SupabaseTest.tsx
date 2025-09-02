import { useEffect, useState } from 'react'
import { YStack, Text, Button } from '@my/ui'
import { supabase } from '../lib/supabase'

export function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [error, setError] = useState<string>('')

  const testConnection = async () => {
    try {
      setStatus('loading')
      setError('')
      
      // Simple test - try to get the current session
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        throw error
      }
      
      // If we get here, connection works!
      setStatus('connected')
      console.log('✅ Supabase connected successfully!')
      
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('❌ Supabase connection failed:', err)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <YStack space="$4" padding="$4">
      <Text fontSize="$6" fontWeight="bold">
        Supabase Connection Test
      </Text>
      
      {status === 'loading' && (
        <Text color="$blue10">🔄 Testing connection...</Text>
      )}
      
      {status === 'connected' && (
        <Text color="$green10">✅ Connected successfully!</Text>
      )}
      
      {status === 'error' && (
        <YStack space="$2">
          <Text color="$red10">❌ Connection failed</Text>
          <Text fontSize="$3" color="$red9">{error}</Text>
        </YStack>
      )}
      
      <Button onPress={testConnection}>
        Test Again
      </Button>
    </YStack>
  )
}
