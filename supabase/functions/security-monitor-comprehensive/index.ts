import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface SecurityMonitoringResult {
  monitoring_time: string;
  active_alerts_24h: number;
  critical_alerts_24h: number;
  rate_limit_violations_24h: number;
  security_status: 'secure' | 'monitoring' | 'elevated' | 'high_risk' | 'critical';
  recommendations: string[];
  last_scan_by: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Security monitoring function started')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      console.error('User is not admin:', profileError)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Admin user ${user.id} running security monitoring`)

    // Run comprehensive security monitoring
    const { data: monitoringResult, error: monitoringError } = await supabase
      .rpc('run_security_monitoring')

    if (monitoringError) {
      console.error('Security monitoring failed:', monitoringError)
      return new Response(
        JSON.stringify({ 
          error: 'Security monitoring failed',
          details: monitoringError.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const result: SecurityMonitoringResult = monitoringResult as SecurityMonitoringResult

    // Get additional security metrics
    const { data: recentAlerts } = await supabase
      .from('security_alerts')
      .select('alert_type, severity, created_at, resolved')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    // Get rate limiting data
    const { data: rateLimitData } = await supabase
      .from('auth_rate_limits')
      .select('ip_address, attempt_count, blocked_until, last_attempt')
      .gte('last_attempt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('attempt_count', { ascending: false })
      .limit(10)

    // Enhanced response with additional security data
    const enhancedResult = {
      ...result,
      recent_alerts: recentAlerts || [],
      top_rate_limited_ips: rateLimitData || [],
      scan_timestamp: new Date().toISOString(),
      security_recommendations: generateSecurityRecommendations(result),
    }

    console.log(`Security monitoring completed. Status: ${result.security_status}`)

    return new Response(
      JSON.stringify(enhancedResult),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in security monitoring:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function generateSecurityRecommendations(result: SecurityMonitoringResult): string[] {
  const recommendations: string[] = []

  if (result.critical_alerts_24h > 0) {
    recommendations.push('🚨 IMMEDIATE ACTION: Review and resolve critical security alerts')
    recommendations.push('📊 Investigate the root cause of critical security events')
  }

  if (result.rate_limit_violations_24h > 20) {
    recommendations.push('🛡️ High rate limiting activity detected - investigate potential attacks')
    recommendations.push('🔍 Review IP addresses with multiple failed attempts')
  }

  if (result.active_alerts_24h > 10) {
    recommendations.push('📈 High alert volume - consider reviewing security policies')
    recommendations.push('🔧 Audit recent system changes that might have triggered alerts')
  }

  if (result.security_status === 'secure') {
    recommendations.push('✅ System security status is good - maintain current monitoring')
    recommendations.push('🔄 Continue regular security monitoring and updates')
  }

  // Always include general security best practices
  recommendations.push('🔐 Ensure leaked password protection is enabled in Supabase Auth settings')
  recommendations.push('📋 Regularly review and update security policies')
  recommendations.push('🎯 Monitor user activity patterns for anomalies')

  return recommendations
}