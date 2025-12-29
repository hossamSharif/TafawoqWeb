import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fvstedbsjiqvryqpnmzl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2c3RlZGJzamlxdnJ5cXBubXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEzNTI3OSwiZXhwIjoyMDczNzExMjc5fQ.KWmtmoPziqWBGMKzknqbA9K6zVnf6J5iQmu8HdbGnHY'

const email = 'halabija@gmail.com'
const password = 'Hossam1990@'

async function verifyUserManually() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('🔍 Checking if user exists...')

  // Check if user exists in auth.users
  const { data: users, error: queryError } = await supabase.auth.admin.listUsers()

  if (queryError) {
    console.error('❌ Error querying users:', queryError)
    return
  }

  const existingUser = users.users.find(u => u.email === email)

  if (existingUser) {
    console.log('✅ User exists:', existingUser.id)
    console.log('Email confirmed:', existingUser.email_confirmed_at ? 'Yes' : 'No')

    if (!existingUser.email_confirmed_at) {
      console.log('\n📧 Manually confirming email...')

      // Update user to confirm email
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { email_confirm: true }
      )

      if (updateError) {
        console.error('❌ Error confirming email:', updateError)
        return
      }

      console.log('✅ Email confirmed successfully!')
      console.log('Updated user:', updateData.user.id)
    } else {
      console.log('✅ Email already confirmed!')
    }

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', existingUser.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', profileError)
    } else if (!profile) {
      console.log('\n👤 Creating user profile...')

      const { data: newProfile, error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: existingUser.id,
          email: email,
          display_name: email.split('@')[0],
          academic_track: 'scientific',
          onboarding_completed: false,
          total_practice_hours: 0,
          is_admin: false,
          is_banned: false,
          is_disabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createProfileError) {
        console.error('❌ Error creating profile:', createProfileError)
      } else {
        console.log('✅ Profile created successfully!')
      }
    } else {
      console.log('✅ User profile exists')
    }

    console.log('\n🎉 Account setup complete!')
    console.log('\n📋 Login credentials:')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('\n🌐 You can now login at: http://localhost:3000')

  } else {
    console.log('❌ User not found. Creating new user...')

    // Create new user with email already confirmed
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
      },
    })

    if (signUpError) {
      console.error('❌ Error creating user:', signUpError)
      return
    }

    console.log('✅ User created:', signUpData.user.id)

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: signUpData.user.id,
        email: email,
        display_name: email.split('@')[0],
        academic_track: 'scientific',
        onboarding_completed: false,
        total_practice_hours: 0,
        is_admin: false,
        is_banned: false,
        is_disabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
    } else {
      console.log('✅ Profile created successfully!')
    }

    console.log('\n🎉 Account created and verified!')
    console.log('\n📋 Login credentials:')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('\n🌐 You can now login at: http://localhost:3000')
  }
}

verifyUserManually().catch(console.error)
