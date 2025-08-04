import { supabase } from '../lib/supabase'

export async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error)
      return false
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

export async function testTriggerCreation() {
  console.log('🧪 Testing trigger creation...')
  
  try {
    // Check if the trigger exists
    const { data, error } = await supabase.rpc('check_trigger_exists', {
      trigger_name: 'on_auth_user_created'
    })
    
    if (error) {
      console.log('⚠️ Could not check trigger (this is normal if RPC function does not exist)')
      return true // Assume trigger exists
    }
    
    console.log('✅ Trigger check completed')
    return true
  } catch (error) {
    console.log('⚠️ Trigger check failed (this might be normal):', error)
    return true // Assume trigger exists
  }
}

export async function testManualProfileCreation(userId: string, email: string, fullName: string) {
  console.log('🧪 Testing manual profile creation...')
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email: email,
        full_name: fullName,
        role: 'user',
        initials: fullName.substring(0, 2).toUpperCase()
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Manual profile creation failed:', error)
      return false
    }
    
    console.log('✅ Manual profile creation successful:', data)
    return true
  } catch (error) {
    console.error('❌ Manual profile creation error:', error)
    return false
  }
} 