import { clerkClient } from '@clerk/clerk-sdk-node';

// Configure the JWT template for Supabase
export async function configureSupabaseJWT() {
  try {
    // Create or update the JWT template
    await clerkClient.jwtTemplates.createOrUpdate({
      name: 'supabase',
      claims: {
        role: 'authenticated',
        user_id: '{{user.id}}',
        aud: 'authenticated'
      }
    });
    console.log('Successfully configured Supabase JWT template');
  } catch (error) {
    console.error('Error configuring Supabase JWT template:', error);
    throw error;
  }
} 