import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from './useFamily';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function useReportGeneration() {
  const { user } = useAuth();
  const { family, familyMembers } = useFamily();
  const [generating, setGenerating] = useState(false);

  const generateWeeklyReport = async () => {
    if (!family?.id || !user) return;

    try {
      setGenerating(true);

      // Fetch data for the last week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [choresResult, progressResult, messagesResult] = await Promise.all([
        supabase
          .from('chores')
          .select(`
            *,
            assigned_to_profile:profiles!assigned_to (display_name),
            created_by_profile:profiles!created_by (display_name)
          `)
          .eq('family_id', family.id)
          .gte('created_at', weekAgo.toISOString()),
        
        supabase
          .from('progress_logs')
          .select('*')
          .eq('family_id', family.id)
          .gte('created_at', weekAgo.toISOString()),
        
        supabase
          .from('family_messages')
          .select('*')
          .eq('family_id', family.id)
          .gte('created_at', weekAgo.toISOString())
      ]);

      const reportData = {
        period: `${weekAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
        family: family.name,
        chores: choresResult.data || [],
        progress: progressResult.data || [],
        messages: messagesResult.data || [],
        members: familyMembers
      };

      // Generate PDF
      const pdf = new jsPDF();
      
      // Title
      pdf.setFontSize(20);
      pdf.text(`${family.name} - Weekly Report`, 20, 30);
      
      // Period
      pdf.setFontSize(12);
      pdf.text(`Period: ${reportData.period}`, 20, 45);

      // Family Summary
      pdf.setFontSize(16);
      pdf.text('Family Summary', 20, 65);
      pdf.setFontSize(12);
      pdf.text(`Total Members: ${familyMembers.length}`, 25, 80);
      pdf.text(`Chores Created: ${reportData.chores.length}`, 25, 90);
      pdf.text(`Activities Logged: ${reportData.progress.length}`, 25, 100);
      pdf.text(`Messages Sent: ${reportData.messages.length}`, 25, 110);

      // Chores Table
      let currentY = 130;
      if (reportData.chores.length > 0) {
        pdf.setFontSize(16);
        pdf.text('Chores Overview', 20, currentY);
        
        const choreTableData = reportData.chores.map(chore => [
          chore.title,
          chore.assigned_to_profile?.display_name || 'Unassigned',
          chore.status,
          chore.points_value.toString(),
          chore.difficulty || 'Easy'
        ]);

        const tableResult = pdf.autoTable({
          startY: currentY + 10,
          head: [['Chore', 'Assigned To', 'Status', 'Points', 'Difficulty']],
          body: choreTableData,
          theme: 'grid',
          styles: { fontSize: 10 }
        });
        
        currentY = (tableResult as any).finalY + 20;
      }

      // Performance Summary
      const completedChores = reportData.chores.filter(c => c.status === 'completed');
      const totalPoints = reportData.progress.reduce((sum, p) => sum + (p.points_earned || 0), 0);
      
      pdf.setFontSize(16);
      pdf.text('Performance Summary', 20, currentY);
      pdf.setFontSize(12);
      pdf.text(`Completion Rate: ${reportData.chores.length > 0 ? Math.round((completedChores.length / reportData.chores.length) * 100) : 0}%`, 25, currentY + 15);
      pdf.text(`Total Points Earned: ${totalPoints}`, 25, currentY + 25);

      // Save the PDF
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Save report to database
      const { data: reportRecord, error } = await supabase
        .from('family_reports')
        .insert({
          family_id: family.id,
          generated_by: user.id,
          report_type: 'weekly',
          report_data: reportData,
          report_url: pdfUrl
        })
        .select()
        .single();

      if (error) throw error;

      // Download the PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${family.name}-weekly-report-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();

      return reportRecord;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  return {
    generateWeeklyReport,
    generating,
  };
}