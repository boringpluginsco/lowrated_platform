import { supabase } from '../lib/supabase'

export async function testSupabaseConnection() {
  console.log('🧪 [testSupabase] Testing Supabase connection...')
  console.log('🧪 [testSupabase] Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('🧪 [testSupabase] Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  
  try {
    // Test 1: Basic connection test
    console.log('🧪 [testSupabase] Test 1: Basic connection test...');
    const { error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(0)
    
    console.log('🧪 [testSupabase] Test 1 result:', {
      hasError: !!testError,
      errorMessage: testError?.message || 'None',
      errorCode: testError?.code || 'None',
      errorDetails: testError?.details || 'None'
    });
    
    if (testError) {
      console.error('❌ [testSupabase] Test 1 failed:', testError)
      
      // Test 2: Try with specific columns
      console.log('🧪 [testSupabase] Test 2: Trying with specific columns...');
      const { error: testError2 } = await supabase
        .from('user_profiles')
        .select('id, email')
        .limit(1)
      
      console.log('🧪 [testSupabase] Test 2 result:', {
        hasError: !!testError2,
        errorMessage: testError2?.message || 'None',
        errorCode: testError2?.code || 'None'
      });
      
      if (testError2) {
        console.error('❌ [testSupabase] Test 2 also failed:', testError2)
        
        // Test 3: Try without any select (just test connection)
        console.log('🧪 [testSupabase] Test 3: Testing raw connection...');
        const { error: testError3 } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(0)
        
        console.log('🧪 [testSupabase] Test 3 result:', {
          hasError: !!testError3,
          errorMessage: testError3?.message || 'None',
          errorCode: testError3?.code || 'None'
        });
        
        if (testError3) {
          console.error('❌ [testSupabase] All connection tests failed')
          
          // Check for specific error types
          if (testError3.message.includes('relation "user_profiles" does not exist')) {
            console.error('❌ [testSupabase] user_profiles table does not exist')
            return false
          }
          
          if (testError3.message.includes('permission') || testError3.message.includes('RLS')) {
            console.error('❌ [testSupabase] Permission/RLS error - table exists but access denied')
            return false
          }
          
          if (testError3.code === '500' || testError3.message.includes('500')) {
            console.error('❌ [testSupabase] Server error (500) - table may have structural issues')
            return false
          }
          
          return false
        }
      }
    }
    
    console.log('✅ [testSupabase] Database connection successful')
    return true
  } catch (error) {
    console.error('❌ [testSupabase] Connection test failed:', error)
    return false
  }
}

export async function testTriggerCreation() {
  console.log('🧪 [testSupabase] Testing trigger creation...')
  
  try {
    // Since we can't query information_schema through REST API, let's test the RPC function directly
    // We'll use a test call that should fail gracefully if the function doesn't exist
    console.log('🧪 [testSupabase] Testing create_user_profile RPC function existence...');
    
    // Try to call the function with invalid parameters to see if it exists
    const { data, error } = await supabase.rpc('create_user_profile', {
      user_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID
      user_email: 'test@example.com',
      user_full_name: 'Test User',
      user_role: 'user',
      user_initials: 'TU'
    })
    
    console.log('🧪 [testSupabase] RPC function test result:', {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message || 'None',
      errorCode: error?.code || 'None'
    });
    
    if (error) {
      // If we get a foreign key constraint error, it means the function exists
      if (error.message.includes('foreign key constraint') || error.message.includes('violates foreign key')) {
        console.log('✅ [testSupabase] create_user_profile function exists (foreign key error is expected)')
        return true
      }
      
      // If we get a function not found error, the function doesn't exist
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('❌ [testSupabase] create_user_profile function does not exist')
        return false
      }
      
      // If we get a permission error, the function exists but we don't have permission
      if (error.message.includes('permission') || error.message.includes('RLS')) {
        console.log('✅ [testSupabase] create_user_profile function exists (permission error is expected)')
        return true
      }
      
      console.log('⚠️ [testSupabase] RPC function test failed with unexpected error:', error.message)
      return false
    }
    
    console.log('✅ [testSupabase] create_user_profile function exists and is accessible')
    return true
  } catch (error) {
    console.log('⚠️ [testSupabase] Trigger check failed:', error)
    return false
  }
}

export async function testManualProfileCreation(userId: string, email: string, fullName: string) {
  console.log('🧪 [testSupabase] Testing manual profile creation...')
  console.log('🧪 [testSupabase] Test data:', { userId, email, fullName });
  
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
    
    console.log('🧪 [testSupabase] Manual insert result:', {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message || 'None'
    });
    
    if (error) {
      console.error('❌ [testSupabase] Manual profile creation failed:', error)
      return false
    }
    
    console.log('✅ [testSupabase] Manual profile creation successful:', data)
    return true
  } catch (error) {
    console.error('❌ [testSupabase] Manual profile creation error:', error)
    return false
  }
}

// New function to test RLS policies
export async function testRLSPolicies() {
  console.log('🧪 [testSupabase] Testing RLS policies...')
  
  try {
    // Test if we can read from the table at all
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    
    console.log('🧪 [testSupabase] RLS test result:', {
      hasData: !!data,
      dataLength: data?.length || 0,
      hasError: !!error,
      errorMessage: error?.message || 'None'
    });
    
    if (error) {
      if (error.message.includes('permission') || error.message.includes('RLS')) {
        console.log('⚠️ [testSupabase] RLS is blocking access (expected for unauthenticated users)')
        return 'RLS_BLOCKING'
      }
      console.error('❌ [testSupabase] RLS test failed:', error)
      return false
    }
    
    console.log('✅ [testSupabase] RLS test passed')
    return true
  } catch (error) {
    console.error('❌ [testSupabase] RLS test error:', error)
    return false
  }
} 