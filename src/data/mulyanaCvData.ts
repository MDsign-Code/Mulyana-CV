import type {
  DigestSettingsData,
  ExperienceItem,
  PortfolioItemData,
  ProfileSettingsData,
  ProfileVisitData,
  RecruiterAlertData,
  SkillItem,
} from '../types';

export const OWNER_DEFAULT_UID = 'mulyana-dzign-owner';

export function assetUrl(path: string): string {
  if (!path) return path;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}${path.replace(/^\/+/, '')}`;
}

export const MULYANA_CONTACT = {
  phone: '+62-89619774464',
  whatsapp: 'https://wa.me/6289619774464',
  email: 'mulyana983@gmail.com',
  accountEmail: 'mulyana15.arthapro@gmail.com',
  originalCvPdfUrl: assetUrl('/assets/aistudio/Mulyana_CV_c792d426.pdf'),
  portraitUrl: assetUrl('/assets/portfolio/mulyana_portrait.png'),
  logoUrl: assetUrl('/assets/portfolio/mulyana_logo.png'),
};

export const DEFAULT_PROFILE_SETTINGS: ProfileSettingsData = {
  id: 'mulyana-primary',
  ownerUid: OWNER_DEFAULT_UID,
  fullName: 'Mulyana',
  brandName: 'Mulyana D-Zign',
  headline: 'Senior Graphic Designer · Advertising, Book Design & Packaging',
  tagline: 'Bring Your Design One Step Ahead',
  bio: 'Graphic designer with over 15 years of experience across publishing houses, advertising agencies, entertainment centers, and international freelance collaborations. Combining strategic thinking, visual craft, and a proven track record of more than 100 international design contest wins.',
  location: 'Bogor, West Java, Indonesia',
  yearsExperience: 15,
  awardsCount: 100,
  linkedinUrl: 'https://www.linkedin.com/in/mulyanadesign',
  behanceUrl: 'https://www.behance.net/md_dzign',
  instagramUrl: 'https://www.instagram.com/mulya_dzign',
  autoSyncEnabled: true,
  lastSyncedAt: new Date().toISOString(),
};

export const MULYANA_SKILLS: SkillItem[] = [
  { name: 'Adobe Photoshop', level: 92, category: 'Raster & Retouching' },
  { name: 'Adobe Illustrator', level: 96, category: 'Vector & Branding' },
  { name: 'Adobe InDesign', level: 90, category: 'Editorial & Book Layout' },
  { name: 'Adobe Dimension', level: 84, category: '3D Packaging Mockup' },
  { name: 'Microsoft PowerPoint', level: 86, category: 'Pitch Deck & Presentation' },
  { name: 'Amazon KDP Book Interior', level: 92, category: 'Print Trim, Bleed & Gutter Formatting' },
  { name: 'EPUB Fixed Layout', level: 90, category: 'Illustrated & Fixed-Grid eBooks' },
  { name: 'EPUB Reflowable', level: 90, category: 'EPUB3, Kindle & Responsive Typography' },
];

export const MULYANA_ABILITIES: string[] = [
  'Logo Design',
  'Brochure & Flyer',
  'Book Layout',
  'Interior Book KDP',
  'EPUB Fixed Layout',
  'EPUB Reflowable',
  'Presentation / Pitch Deck',
  'Packaging Design',
  'Annual Report Design',
  'Company Profile',
  'Booth Design',
  'Food Menu Design',
];

export const MULYANA_LANGUAGES: Array<{ name: string; proficiency: string }> = [
  { name: 'Indonesian', proficiency: 'Native' },
  { name: 'English', proficiency: 'Professional Working' },
  { name: 'Betawi', proficiency: 'Native' },
];

export const MULYANA_EXPERIENCE: ExperienceItem[] = [
  {
    id: 'exp-freelance',
    company: 'Mulyana D-Zign · Freelance & Global Contests',
    role: 'Principal Brand, Book & Packaging Designer',
    period: '2022 – Present',
    location: 'Remote · Domestic & International Clients',
    summary:
      'Delivering visual identities, retail packaging, KDP book interiors, EPUB formatting, corporate profiles, and marketing collateral for startups and established brands worldwide.',
    highlights: [
      'Won over 100 international design competitions on 99designs and global client platforms.',
      'Designed retail and cosmetic packaging (Algoplay Seaweed Mask, Baby Spacezone) as well as corporate brochures (Scapes Supply, Car Park Services Ltd).',
    ],
  },
  {
    id: 'exp-fantasi',
    company: 'FANTASI ERESTAMA',
    role: 'Graphic Designer for Advertising & Visual Marketing',
    period: 'Sept 2012 – July 2022',
    location: 'Bogor, West Java',
    summary:
      'Led visual marketing production, exhibition booth graphics, advertising campaigns, and integrated brand materials for nearly 10 years.',
    highlights: [
      'Produced print campaigns, digital signage, and large-format trade exhibition booths.',
      'Standardized visual marketing assets to strengthen brand consistency across venues.',
    ],
  },
  {
    id: 'exp-optima',
    company: 'OPTIMA Publishing',
    role: 'Book Interior Layout & Cover Designer',
    period: 'July 2010 – August 2012',
    location: 'Depok, West Java',
    summary:
      'Owned end-to-end book interior typesetting, editorial grid architecture, and commercial book cover design for print publications.',
    highlights: [
      'Structured multi-page editorial layouts in Adobe InDesign meeting offset print specifications.',
      'Designed commercial book covers and publisher promotional materials.',
    ],
  },
  {
    id: 'exp-sparx',
    company: 'SPARX Advertising',
    role: 'Graphic Designer for Advertising & Visual Marketing',
    period: 'Feb 2007 – April 2010',
    location: 'Bogor, West Java',
    summary:
      'Created commercial advertising collateral, brochures, flyers, and brand identities for corporate and retail clients.',
    highlights: [
      'Developed print campaigns and visual merchandising assets for agency accounts.',
      'Built deep technical expertise in prepress workflows and commercial photo retouching.',
    ],
  },
];

export const DEFAULT_PORTFOLIO_ITEMS: PortfolioItemData[] = [
  {
    id: 'work-algoplay-seaweed',
    ownerUid: OWNER_DEFAULT_UID,
    title: 'Algoplay Seaweed Face Mask Packaging',
    client: 'Algoplay Skincare (Italy)',
    category: 'Packaging',
    sourcePlatform: 'Behance',
    year: '2024',
    description:
      'Front-and-back pouch packaging design for a premium seaweed facial mask. Combines clean botanical illustration, multilingual product claims hierarchy, and 3D marble presentation.',
    imageUrl: assetUrl('/assets/portfolio/work_algoplay_packaging.png'),
    externalUrl: 'https://www.behance.net/md_dzign',
    views: 1420,
    likes: 184,
    featured: true,
  },
  {
    id: 'work-cps-profile',
    ownerUid: OWNER_DEFAULT_UID,
    title: 'Car Park Services Ltd — Company Profile & Deck',
    client: 'Car Park Services Limited (UK)',
    category: 'Company Profile',
    sourcePlatform: 'LinkedIn',
    year: '2024',
    description:
      'Multi-page corporate profile and pitch deck for a car park enforcement and operations firm in Northern Ireland, featuring modular infographics and bold red-navy typography.',
    imageUrl: assetUrl('/assets/portfolio/work_cps_profile.png'),
    externalUrl: 'https://www.linkedin.com/in/mulyanadesign',
    views: 980,
    likes: 112,
    featured: true,
  },
  {
    id: 'work-kochrian-booth',
    ownerUid: OWNER_DEFAULT_UID,
    title: 'Kochrian Exhibition Booth & Trade Signage',
    client: 'Kochrian Acoustic Systems (Germany)',
    category: 'Booth & Exhibition',
    sourcePlatform: 'CV Archive',
    year: '2023',
    description:
      'Modular trade exhibition booth concept, roll-up banners, and product specification wall panels for European medical hearing systems.',
    imageUrl: assetUrl('/assets/portfolio/work_kochrian_booth.png'),
    externalUrl: 'https://www.behance.net/md_dzign',
    views: 845,
    likes: 96,
    featured: true,
  },
  {
    id: 'work-baby-spacezone',
    ownerUid: OWNER_DEFAULT_UID,
    title: 'Baby Spacezone Trifold Play Mattress Box',
    client: 'Baby Spacezone (USA)',
    category: 'Packaging',
    sourcePlatform: 'Instagram',
    year: '2024',
    description:
      'Full-color retail carton box packaging featuring playful astronaut character art, interior lid storytelling, and high-visibility shelf typography.',
    imageUrl: assetUrl('/assets/portfolio/work_baby_packaging.png'),
    externalUrl: 'https://www.instagram.com/mulya_dzign',
    views: 1680,
    likes: 231,
    featured: true,
  },
  {
    id: 'work-scapes-supply',
    ownerUid: OWNER_DEFAULT_UID,
    title: 'Scapes Supply Landscape Contractors Trifold',
    client: 'Scapes Supply Contractors',
    category: 'Brochure & Print',
    sourcePlatform: 'Behance',
    year: '2023',
    description:
      'Tri-fold corporate brochure for landscape contractors combining curved photo masks, aerial site photography, and crisp green-and-slate editorial grids.',
    imageUrl: assetUrl('/assets/portfolio/work_scapes_brochure.png'),
    externalUrl: 'https://www.behance.net/md_dzign',
    views: 730,
    likes: 88,
    featured: false,
  },
];

function formatDateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function isoOffset(daysAgo: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function generateBaselineVisits(ownerUid: string): ProfileVisitData[] {
  const templates: Array<
    Omit<ProfileVisitData, 'id' | 'ownerUid' | 'visitDate' | 'createdAtIso'> & {
      daysAgo: number;
      hour: number;
      min: number;
    }
  > = [
    {
      visitorName: 'Nadia Kusuma',
      visitorRole: 'Recruiter',
      company: 'Tokopedia Creative Studio',
      location: 'Jakarta, ID',
      sourceChannel: 'LinkedIn',
      sectionViewed: 'Experience & Algoplay Packaging',
      durationSeconds: 265,
      device: 'Desktop',
      isRecruiter: true,
      daysAgo: 0,
      hour: 10,
      min: 24,
    },
    {
      visitorName: 'Marcus Vance',
      visitorRole: 'Creative Director',
      company: 'Studio Nordik Berlin',
      location: 'Berlin, DE',
      sourceChannel: 'Behance',
      sectionViewed: 'Kochrian Exhibition Booth',
      durationSeconds: 312,
      device: 'Desktop',
      isRecruiter: false,
      daysAgo: 0,
      hour: 8,
      min: 45,
    },
    {
      visitorName: 'Rina Wijaya',
      visitorRole: 'Hiring Manager',
      company: 'Traveloka Brand Team',
      location: 'Jakarta, ID',
      sourceChannel: 'LinkedIn',
      sectionViewed: 'Full CV & CPS Pitch Deck',
      durationSeconds: 198,
      device: 'Desktop',
      isRecruiter: true,
      daysAgo: 1,
      hour: 15,
      min: 12,
    },
    {
      visitorName: 'Dian Pratiwi',
      visitorRole: 'Recruiter',
      company: 'GoTo Financial Talent',
      location: 'Jakarta, ID',
      sourceChannel: 'LinkedIn',
      sectionViewed: 'Packaging Portfolio & 99designs',
      durationSeconds: 224,
      device: 'Mobile',
      isRecruiter: true,
      daysAgo: 2,
      hour: 11,
      min: 5,
    },
    {
      visitorName: 'Elena Rossi',
      visitorRole: 'Client',
      company: 'Algoplay Milano',
      location: 'Milan, IT',
      sourceChannel: 'Email Link',
      sectionViewed: 'Algoplay Seaweed Packaging',
      durationSeconds: 175,
      device: 'Desktop',
      isRecruiter: false,
      daysAgo: 2,
      hour: 17,
      min: 40,
    },
    {
      visitorName: 'Budi Santoso',
      visitorRole: 'Peer',
      company: 'Graphic Designers Guild',
      location: 'Bandung, ID',
      sourceChannel: 'Instagram',
      sectionViewed: 'Baby Spacezone Packaging',
      durationSeconds: 118,
      device: 'Mobile',
      isRecruiter: false,
      daysAgo: 3,
      hour: 13,
      min: 30,
    },
    {
      visitorName: 'Sarah Jenkins',
      visitorRole: 'Recruiter',
      company: 'Canva APAC Talent',
      location: 'Sydney, AU',
      sourceChannel: 'Behance',
      sectionViewed: 'Works Gallery & Experience',
      durationSeconds: 290,
      device: 'Desktop',
      isRecruiter: true,
      daysAgo: 4,
      hour: 9,
      min: 15,
    },
    {
      visitorName: 'Hendra Gunawan',
      visitorRole: 'Client',
      company: 'PT Sinar Kemas Utama',
      location: 'Bogor, ID',
      sourceChannel: 'Direct / QR',
      sectionViewed: 'Contact & Product Packaging',
      durationSeconds: 144,
      device: 'Mobile',
      isRecruiter: false,
      daysAgo: 5,
      hour: 16,
      min: 20,
    },
    {
      visitorName: 'Claire Dubois',
      visitorRole: 'Hiring Manager',
      company: 'Publicis Groupe SEA',
      location: 'Singapore, SG',
      sourceChannel: 'LinkedIn',
      sectionViewed: 'CPS Company Profile & CV',
      durationSeconds: 248,
      device: 'Desktop',
      isRecruiter: true,
      daysAgo: 6,
      hour: 14,
      min: 50,
    },
    {
      visitorName: 'Arif Rahman',
      visitorRole: 'Client',
      company: 'Kopi Nusantara Roastery',
      location: 'Depok, ID',
      sourceChannel: 'Instagram',
      sectionViewed: 'Packaging & Branding',
      durationSeconds: 162,
      device: 'Mobile',
      isRecruiter: false,
      daysAgo: 8,
      hour: 19,
      min: 10,
    },
    {
      visitorName: 'Amanda Chen',
      visitorRole: 'Recruiter',
      company: 'Shopee Design Ops',
      location: 'Singapore, SG',
      sourceChannel: 'LinkedIn',
      sectionViewed: 'CV Summary & Adobe Skills',
      durationSeconds: 210,
      device: 'Desktop',
      isRecruiter: true,
      daysAgo: 10,
      hour: 10,
      min: 5,
    },
    {
      visitorName: 'Lucas Meyer',
      visitorRole: 'Creative Director',
      company: 'Kochrian MedTech',
      location: 'Munich, DE',
      sourceChannel: 'Direct / QR',
      sectionViewed: 'Kochrian Exhibition Booth',
      durationSeconds: 195,
      device: 'Tablet',
      isRecruiter: false,
      daysAgo: 12,
      hour: 15,
      min: 44,
    },
    {
      visitorName: 'Putri Maharani',
      visitorRole: 'Recruiter',
      company: 'Blibli Brand Studio',
      location: 'Jakarta, ID',
      sourceChannel: 'Instagram',
      sectionViewed: 'Baby Spacezone & Algoplay',
      durationSeconds: 188,
      device: 'Mobile',
      isRecruiter: true,
      daysAgo: 15,
      hour: 11,
      min: 33,
    },
    {
      visitorName: 'Thomas Wright',
      visitorRole: 'Client',
      company: 'Car Park Services Ltd',
      location: 'Belfast, UK',
      sourceChannel: 'Email Link',
      sectionViewed: 'CPS Company Profile',
      durationSeconds: 205,
      device: 'Desktop',
      isRecruiter: false,
      daysAgo: 19,
      hour: 16,
      min: 18,
    },
    {
      visitorName: 'Fajar Nugroho',
      visitorRole: 'Hiring Manager',
      company: 'Gramedia Pustaka Utama',
      location: 'Jakarta, ID',
      sourceChannel: 'LinkedIn',
      sectionViewed: 'OPTIMA Publishing & Book Layout',
      durationSeconds: 276,
      device: 'Desktop',
      isRecruiter: true,
      daysAgo: 23,
      hour: 9,
      min: 52,
    },
    {
      visitorName: 'Siti Nurhaliza',
      visitorRole: 'Peer',
      company: 'Behance Indonesia',
      location: 'Yogyakarta, ID',
      sourceChannel: 'Behance',
      sectionViewed: 'Scapes Supply Trifold',
      durationSeconds: 132,
      device: 'Desktop',
      isRecruiter: false,
      daysAgo: 27,
      hour: 20,
      min: 14,
    },
  ];

  return templates.map((t, index) => ({
    id: `visit-seed-${index + 1}`,
    ownerUid,
    visitorName: t.visitorName,
    visitorRole: t.visitorRole,
    company: t.company,
    location: t.location,
    sourceChannel: t.sourceChannel,
    sectionViewed: t.sectionViewed,
    durationSeconds: t.durationSeconds,
    device: t.device,
    isRecruiter: t.isRecruiter,
    visitDate: formatDateOffset(t.daysAgo),
    createdAtIso: isoOffset(t.daysAgo, t.hour, t.min),
  }));
}

export function generateBaselineAlerts(visits: ProfileVisitData[]): RecruiterAlertData[] {
  return visits
    .filter((v) => v.isRecruiter)
    .slice(0, 6)
    .map((v, idx) => ({
      id: `alert-seed-${idx + 1}`,
      ownerUid: v.ownerUid,
      visitId: v.id,
      visitorName: v.visitorName,
      visitorRole: v.visitorRole,
      company: v.company,
      sourceChannel: v.sourceChannel,
      sectionViewed: v.sectionViewed,
      isRead: idx > 1,
      createdAtIso: v.createdAtIso || new Date().toISOString(),
    }));
}

export const DEFAULT_DIGEST_SETTINGS: DigestSettingsData = {
  id: 'weekly-digest-primary',
  ownerUid: OWNER_DEFAULT_UID,
  recipientEmail: 'mulyana15.arthapro@gmail.com',
  enabled: true,
  dayOfWeek: 'Monday',
  sendHour: '08:00',
  includeRecruiterLog: true,
  includeSocialSync: true,
  lastSentAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  totalSent: 12,
};
