import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface SecurityReportRequest {
  includeEvents?: boolean;
  includeMetrics?: boolean;
  includeVulnerabilities?: boolean;
  format?: 'pdf' | 'json' | 'csv';
  dateRange?: {
    start: string;
    end: string;
  };
}

interface SecurityReport {
  reportId: string;
  generatedAt: string;
  reportType: string;
  summary: {
    totalEvents: number;
    criticalAlerts: number;
    securityScore: number;
    complianceStatus: string;
  };
  events: any[];
  vulnerabilities: any[];
  recommendations: string[];
  metadata: {
    generatedBy: string;
    reportPeriod: string;
    dataSource: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'full_admin'].includes(profile.role)) {
      throw new Error('Admin access required');
    }

    const requestBody: SecurityReportRequest = await req.json();
    console.log('Security report request:', requestBody);

    const reportId = crypto.randomUUID();
    const generatedAt = new Date().toISOString();

    // Initialize report
    const report: SecurityReport = {
      reportId,
      generatedAt,
      reportType: 'comprehensive_security_report',
      summary: {
        totalEvents: 0,
        criticalAlerts: 0,
        securityScore: 0,
        complianceStatus: 'compliant'
      },
      events: [],
      vulnerabilities: [],
      recommendations: [],
      metadata: {
        generatedBy: user.email || user.id,
        reportPeriod: requestBody.dateRange ? 
          `${requestBody.dateRange.start} to ${requestBody.dateRange.end}` : 
          'Last 30 days',
        dataSource: 'Supabase Security Monitoring'
      }
    };

    // Gather security events
    if (requestBody.includeEvents !== false) {
      let eventsQuery = supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestBody.dateRange) {
        eventsQuery = eventsQuery
          .gte('created_at', requestBody.dateRange.start)
          .lte('created_at', requestBody.dateRange.end);
      } else {
        // Last 30 days by default
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        eventsQuery = eventsQuery.gte('created_at', thirtyDaysAgo.toISOString());
      }

      const { data: events, error: eventsError } = await eventsQuery;
      
      if (eventsError) {
        console.error('Error fetching events:', eventsError);
      } else {
        report.events = events || [];
        report.summary.totalEvents = report.events.length;
        report.summary.criticalAlerts = report.events.filter(e => e.severity === 'critical').length;
      }
    }

    // Gather vulnerability data
    if (requestBody.includeVulnerabilities !== false) {
      const { data: vulnData, error: vulnError } = await supabase
        .from('security_test_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (vulnError) {
        console.error('Error fetching vulnerabilities:', vulnError);
      } else {
        report.vulnerabilities = vulnData || [];
      }
    }

    // Calculate security metrics
    if (requestBody.includeMetrics !== false) {
      const unresolvedCritical = report.events.filter(e => !e.resolved && e.severity === 'critical').length;
      const unresolvedHigh = report.events.filter(e => !e.resolved && e.severity === 'high').length;
      
      // Calculate security score
      report.summary.securityScore = Math.max(0, 100 - (unresolvedCritical * 15) - (unresolvedHigh * 8));
      
      // Determine compliance status
      if (unresolvedCritical > 0) {
        report.summary.complianceStatus = 'non-compliant';
      } else if (unresolvedHigh > 3) {
        report.summary.complianceStatus = 'partial-compliance';
      } else {
        report.summary.complianceStatus = 'compliant';
      }
    }

    // Generate recommendations
    report.recommendations = generateSecurityRecommendations(report);

    // Log report generation
    await supabase.from('security_alerts').insert({
      user_id: user.id,
      alert_type: 'security_report_generated',
      severity: 'info',
      description: `Security report generated: ${reportId}`,
      metadata: {
        report_id: reportId,
        report_type: report.reportType,
        events_included: report.events.length,
        vulnerabilities_included: report.vulnerabilities.length
      }
    });

    // Generate report based on format
    if (requestBody.format === 'pdf') {
      const pdfContent = await generatePDFReport(report);
      return new Response(pdfContent as BodyInit, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="security-report-${reportId}.pdf"`
        },
      });
    } else if (requestBody.format === 'csv') {
      const csvContent = generateCSVReport(report);
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="security-report-${reportId}.csv"`
        },
      });
    } else {
      // Default JSON format
      return new Response(JSON.stringify(report, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Security report generation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSecurityRecommendations(report: SecurityReport): string[] {
  const recommendations: string[] = [];

  // Critical alerts recommendations
  if (report.summary.criticalAlerts > 0) {
    recommendations.push('🚨 URGENT: Address all critical security alerts immediately');
    recommendations.push('Implement emergency incident response procedures');
    recommendations.push('Notify security team and stakeholders of critical issues');
  }

  // Security score recommendations
  if (report.summary.securityScore < 70) {
    recommendations.push('⚠️ LOW SECURITY SCORE: Immediate security improvements required');
    recommendations.push('Conduct comprehensive security assessment');
    recommendations.push('Implement additional security controls');
  } else if (report.summary.securityScore < 85) {
    recommendations.push('🔍 MODERATE SECURITY: Continue security improvements');
    recommendations.push('Review and strengthen existing security measures');
  }

  // Compliance recommendations
  if (report.summary.complianceStatus === 'non-compliant') {
    recommendations.push('📋 COMPLIANCE ISSUE: Address compliance violations immediately');
    recommendations.push('Review regulatory requirements and implement necessary controls');
  }

  // General recommendations
  recommendations.push('🔐 Enable multi-factor authentication for all admin accounts');
  recommendations.push('📚 Conduct regular security training for all team members');
  recommendations.push('🛡️ Implement automated security monitoring and alerting');
  recommendations.push('🔍 Schedule regular penetration testing and vulnerability assessments');
  recommendations.push('📋 Maintain up-to-date incident response procedures');
  recommendations.push('🔄 Regularly review and update security policies');

  return recommendations;
}

async function generatePDFReport(report: SecurityReport): Promise<Uint8Array> {
  // Simplified PDF generation (in a real implementation, you'd use a proper PDF library)
  const pdfContent = `
Security Report - ${report.reportId}
Generated: ${new Date(report.generatedAt).toLocaleString()}

EXECUTIVE SUMMARY
================
Total Security Events: ${report.summary.totalEvents}
Critical Alerts: ${report.summary.criticalAlerts}
Security Score: ${report.summary.securityScore}/100
Compliance Status: ${report.summary.complianceStatus}

RECENT SECURITY EVENTS
=====================
${report.events.slice(0, 10).map(event => `
- ${event.alert_type} (${event.severity})
  ${event.description}
  Date: ${new Date(event.created_at).toLocaleString()}
`).join('')}

RECOMMENDATIONS
==============
${report.recommendations.map(rec => `• ${rec}`).join('\n')}

METADATA
========
Generated by: ${report.metadata.generatedBy}
Report Period: ${report.metadata.reportPeriod}
Data Source: ${report.metadata.dataSource}
  `;

  // Convert to binary (simplified - in real implementation use proper PDF library)
  return new TextEncoder().encode(pdfContent);
}

function generateCSVReport(report: SecurityReport): string {
  const csvRows = [
    'Type,Severity,Description,Date,Status',
    ...report.events.map(event => 
      `"${event.alert_type}","${event.severity}","${event.description}","${event.created_at}","${event.resolved ? 'Resolved' : 'Open'}"`
    )
  ];
  
  return csvRows.join('\n');
}