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
  
  console.log('Password reset function started');
  
  try {
    // Parse request body
    let data;
    try {
      data = JSON.parse(event.body || '{}');
      console.log('Request data:', data);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid JSON in request body' 
        })
      };
    }
    
    const { email } = data;
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          message: 'Email is required' 
        })
      };
    }
    
    console.log(`Processing reset for: ${email}`);
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    // Instead of waiting for the reset email to be sent,
    // we'll just queue it up and return success immediately
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.SITE_URL || 'https://hapnin.netlify.app'}/reset-password-confirmation`
    }).then(result => {
      if (result.error) {
        console.error('Reset error (async):', result.error);
      } else {
        console.log('Reset email sent successfully (async)');
      }
    }).catch(err => {
      console.error('Reset exception (async):', err);
    });
    
    // Return success immediately without waiting
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Password reset request received and is being processed' 
      })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Internal server error' 
      })
    };
  }
};
