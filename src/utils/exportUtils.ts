import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  ExperienceItem,
  PortfolioItemData,
  ProfileSettingsData,
  ProfileVisitData,
  SkillItem,
} from '../types';
import { MULYANA_CONTACT } from '../data/mulyanaCvData';

export function exportVisitsToCsv(visits: ProfileVisitData[]): void {
  const headers = [
    'Visit ID',
    'Date',
    'Timestamp (ISO)',
    'Visitor Name',
    'Role',
    'Company / Organization',
    'Location',
    'Source Channel',
    'Section Viewed',
    'Duration (Seconds)',
    'Device',
    'Recruiter Category',
  ];

  const escapeCell = (val: string | number | boolean): string => {
    const str = String(val ?? '');
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = visits.map((v) =>
    [
      v.id,
      v.visitDate,
      v.createdAtIso || v.visitDate,
      v.visitorName,
      v.visitorRole,
      v.company,
      v.location,
      v.sourceChannel,
      v.sectionViewed,
      v.durationSeconds,
      v.device,
      v.isRecruiter ? 'Yes (Recruiter)' : 'No',
    ]
      .map(escapeCell)
      .join(',')
  );

  const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Mulyana_Visitor_Analytics_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAnalyticsToPdf(
  visits: ProfileVisitData[],
  periodLabel: string,
  summary: {
    totalVisits: number;
    recruiterVisits: number;
    avgDurationSec: number;
    topChannel: string;
  }
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(22, 27, 38);
  doc.rect(0, 0, 210, 34, 'F');

  doc.setTextColor(245, 130, 32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MULYANA D-ZIGN · DIGITAL PORTFOLIO ANALYTICS', 14, 13);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Visitor Traffic & Recruiter Engagement Report', 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Period: ${periodLabel} · Generated: ${new Date().toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })}`,
    14,
    29
  );

  const kpis = [
    { label: 'Total Visits', value: String(summary.totalVisits) },
    { label: 'Recruiter Visits', value: String(summary.recruiterVisits) },
    { label: 'Avg. Duration', value: `${summary.avgDurationSec} sec` },
    { label: 'Top Channel', value: summary.topChannel },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * 46;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, 42, 43, 20, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, 49);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 3, 57);
  });

  autoTable(doc, {
    startY: 70,
    head: [['Date', 'Visitor', 'Role', 'Company', 'Channel', 'Duration', 'Section Viewed']],
    body: visits.map((v) => [
      v.visitDate,
      v.visitorName,
      v.visitorRole,
      v.company,
      v.sourceChannel,
      `${v.durationSeconds}s`,
      v.sectionViewed,
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [22, 27, 38],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`Mulyana_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportDigitalCvToPdf(
  profile: ProfileSettingsData,
  experiences: ExperienceItem[],
  skills: SkillItem[],
  abilities: string[],
  portfolioItems: PortfolioItemData[]
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(22, 27, 38);
  doc.rect(0, 0, 210, 44, 'F');

  doc.setTextColor(245, 130, 32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(profile.fullName.toUpperCase(), 14, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(profile.headline, 14, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `${profile.location}  ·  ${MULYANA_CONTACT.phone}  ·  ${MULYANA_CONTACT.email}`,
    14,
    33
  );
  doc.text(
    `LinkedIn: ${profile.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}  ·  Behance: ${profile.behanceUrl.replace(/^https?:\/\/(www\.)?/, '')}`,
    14,
    39
  );

  let y = 54;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('PROFESSIONAL PROFILE', 14, y);
  doc.setDrawColor(245, 130, 32);
  doc.setLineWidth(0.6);
  doc.line(14, y + 2, 62, y + 2);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const bioLines = doc.splitTextToSize(profile.bio, 182);
  doc.text(bioLines, 14, y);
  y += bioLines.length * 4.6 + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('WORK EXPERIENCE', 14, y);
  doc.line(14, y + 2, 54, y + 2);
  y += 8;

  for (const exp of experiences) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${exp.company} — ${exp.role}`, 14, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${exp.period}  ·  ${exp.location}`, 14, y + 4.5);

    const summaryLines = doc.splitTextToSize(exp.summary, 180);
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(summaryLines, 14, y + 9.5);
    y += 12 + summaryLines.length * 4.3;
  }

  y += 4;
  if (y > 235) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('TOOLS & PRODUCTION SPECIALIZATIONS', 14, y);
  doc.line(14, y + 2, 86, y + 2);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const skillLine = skills.map((s) => `${s.name} (${s.level}%)`).join('  ·  ');
  const wrappedSkills = doc.splitTextToSize(skillLine, 182);
  doc.text(wrappedSkills, 14, y);
  y += wrappedSkills.length * 4.5 + 4;

  const abilitiesLine = `Specializations: ${abilities.join('  ·  ')}`;
  const wrappedAbilities = doc.splitTextToSize(abilitiesLine, 182);
  doc.text(wrappedAbilities, 14, y);
  y += wrappedAbilities.length * 4.5 + 8;

  if (y > 230) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('SELECTED PORTFOLIO WORKS', 14, y);
  doc.line(14, y + 2, 68, y + 2);
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [['Project Title', 'Client', 'Category', 'Source', 'Year']],
    body: portfolioItems.slice(0, 8).map((item) => [
      item.title,
      item.client,
      item.category,
      item.sourcePlatform,
      item.year,
    ]),
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [22, 27, 38], textColor: [255, 255, 255] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${profile.fullName.replace(/\s+/g, '_')}_Digital_CV.pdf`);
}

export function playNotificationChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore autoplay restriction
  }
}
