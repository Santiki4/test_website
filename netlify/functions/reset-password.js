// netlify/functions/reset-password.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  // Log the beginning of the function execution
  console.log('Function started');
  
  try {
    // Check if environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error('Missing environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Server configuration error: Missing environment variables' 
        })
      };
    }
    
    // Parse request body with error handling
    let data;
    try {
      console.log('Raw request body:', event.body);
      data = JSON.parse(event.body || '{}');
      console.log('Parsed data:', data);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid JSON in request body',
          error: parseError.message
        })
      };
    }
    
    const { email, intercom_user_id } = data;
    
    if (!email) {
      console.error('Missing email in request');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          message: 'Email is required' 
        })
      };
    }
    
    console.log(`Processing password reset for email: ${email}`);
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    console.log('Supabase client initialized');
    
    // Set a timeout for the Supabase request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Supabase request timed out')), 8000);
    });
    
    // Send password reset email with timeout
    const resetPromise = supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.SITE_URL || 'https://hapnin.netlify.app'}/reset-password-confirmation`
    });
    
    // Race the reset promise against the timeout
    const { error } = await Promise.race([resetPromise, timeoutPromise])
      .catch(err => {
        console.error('Password reset error:', err);
        return { error: err };
      });
    
    if (error) {
      console.error('Password reset failed:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Failed to send password reset email',
          error: error.message
        })
      };
    }
    
    console.log(`Password reset email sent to ${email}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Password reset email sent successfully' 
      })
    };
  } catch (error) {
    console.error('Unexpected function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};
