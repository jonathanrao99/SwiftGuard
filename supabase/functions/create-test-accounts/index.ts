// @ts-nocheck
import { serve } from 'https://deno.land/std@0.171.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const testAccounts = [
  // Client Accounts
  {
    email: 'client1@test.com',
    password: 'Test123!',
    role: 'client',
    first_name: 'John',
    last_name: 'Smith',
    phone: '+14155551001',
    business_name: 'Nightclub XYZ',
    establishment_type: 'Nightclub',
    location: '123 Main St, San Francisco, CA'
  },
  {
    email: 'client2@test.com',
    password: 'Test123!',
    role: 'client',
    first_name: 'Sarah',
    last_name: 'Johnson',
    phone: '+14155551002',
    business_name: 'Hotel California',
    establishment_type: 'Hotel',
    location: '456 Market St, San Francisco, CA'
  },
  {
    email: 'client3@test.com',
    password: 'Test123!',
    role: 'client',
    first_name: 'Michael',
    last_name: 'Brown',
    phone: '+14155551003',
    business_name: 'Event Center',
    establishment_type: 'Event Venue',
    location: '789 Mission St, San Francisco, CA'
  },
  // Guard Accounts
  {
    email: 'guard1@test.com',
    password: 'Test123!',
    role: 'guard',
    first_name: 'David',
    last_name: 'Wilson',
    phone: '+14155552001',
    gender: 'Male',
    dob: '1990-01-15',
    experience_level: 'Expert',
    years_experience: 8,
    bio: 'Experienced security professional with expertise in nightclub security.',
    certifications: ['Guard Card', 'First Aid', 'CPR'],
    emergency_contact: '+14155552101',
    availability: 'Weekends'
  },
  {
    email: 'guard2@test.com',
    password: 'Test123!',
    role: 'guard',
    first_name: 'Emily',
    last_name: 'Davis',
    phone: '+14155552002',
    gender: 'Female',
    dob: '1992-03-20',
    experience_level: 'Intermediate',
    years_experience: 5,
    bio: 'Specialized in event security and crowd management.',
    certifications: ['Guard Card', 'Crowd Control'],
    emergency_contact: '+14155552102',
    availability: 'Full-time'
  }
];

serve(async (req: Request) => {
  try {
    const createdAccounts = [];

    for (const account of testAccounts) {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        phone: account.phone,
        email_confirm: true,
        phone_confirm: true
      });

      if (authError) {
        console.error(`Error creating auth user ${account.email}:`, authError);
        continue;
      }

      // Create user profile
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: authData.user.id,
          ...account
        }]);

      if (profileError) {
        console.error(`Error creating profile for ${account.email}:`, profileError);
        continue;
      }

      createdAccounts.push({
        email: account.email,
        password: account.password,
        role: account.role
      });
    }

    return new Response(
      JSON.stringify({ 
        message: 'Test accounts created successfully',
        accounts: createdAccounts
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 