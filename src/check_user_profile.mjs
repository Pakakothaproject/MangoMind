import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfsbovvvryfmgpoehlrc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmc2JvdnZ2cnlmbWdwb2VobHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTAwNTEsImV4cCI6MjA3NTMyNjA1MX0.ljhaRpb_DVjTQsQAYAhECVy5ADQ3dm1GxH0s1uxgOws';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserProfile() {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('No active session found');
      return;
    }
    
    console.log('Current user ID:', session.user.id);
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, subscription_packages(name, enabled_models)')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return;
    }
    
    console.log('\nUser Profile:');
    console.log('- Current Package ID:', profile.current_package_id);
    console.log('- Package Expires At:', profile.package_expires_at);
    console.log('- Token Balance:', profile.token_balance);
    console.log('- Free Generations Remaining:', profile.free_generations_remaining);
    
    if (profile.subscription_packages) {
      console.log('- Package Name:', profile.subscription_packages.name);
      console.log('- Enabled Models:', profile.subscription_packages.enabled_models);
    }
    
    // Get available models for this user
    const { data: models, error: modelsError } = await supabase.rpc('get_my_enabled_models');
    
    if (modelsError) {
      console.error('Error fetching models:', modelsError);
      return;
    }
    
    console.log('\nAvailable Models (' + models.length + '):');
    models.forEach(model => {
      console.log('- ' + model.id + ' (' + model.name + ') - is_accessible: ' + model.is_accessible);
    });
    
    // Check if gemini-2.5-flash is accessible
    const geminiModel = models.find(m => m.id === 'google/gemini-2.5-flash');
    if (geminiModel) {
      console.log('\ngemini-2.5-flash status:');
      console.log('- Name:', geminiModel.name);
      console.log('- Is Accessible:', geminiModel.is_accessible);
      console.log('- Is Free Tier:', geminiModel.is_free_tier);
      console.log('- Is Active:', geminiModel.is_active);
    } else {
      console.log('\ngemini-2.5-flash not found in available models');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserProfile();