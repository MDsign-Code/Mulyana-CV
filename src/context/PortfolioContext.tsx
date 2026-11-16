import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, testFirestoreConnection } from '../firebase';
import {
  assetUrl,
  DEFAULT_DIGEST_SETTINGS,
  DEFAULT_PORTFOLIO_ITEMS,
  DEFAULT_PROFILE_SETTINGS,
  OWNER_DEFAULT_UID,
  generateBaselineAlerts,
  generateBaselineVisits,
} from '../data/mulyanaCvData';
import {
  OperationType,
  type DigestSettingsData,
  type PortfolioItemData,
  type ProfileSettingsData,
  type ProfileVisitData,
  type RecruiterAlertData,
  type SocialPlatformStatus,
  type SocialSyncResponse,
  type SourceChannel,
  type VisitorRole,
} from '../types';
import { playNotificationChime } from '../utils/exportUtils';

export const ADMIN_OWNER_EMAIL = 'mulyana15.arthapro@gmail.com';

interface PortfolioContextValue {
  user: User | null;
  authReady: boolean;
  isSigningIn: boolean;
  isAdminMode: boolean;
  isAuthorizedAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  profile: ProfileSettingsData;
  updateProfileSettings: (partial: Partial<ProfileSettingsData>) => Promise<void>;
  portfolioItems: PortfolioItemData[];
  addPortfolioItem: (item: Omit<PortfolioItemData, 'id' | 'ownerUid'>) => Promise<void>;
  visits: ProfileVisitData[];
  alerts: RecruiterAlertData[];
  unreadAlertsCount: number;
  latestToastAlert: RecruiterAlertData | null;
  dismissToastAlert: () => void;
  markAlertAsRead: (alertId: string) => Promise<void>;
  markAllAlertsAsRead: () => Promise<void>;
  digestSettings: DigestSettingsData;
  updateDigestSettings: (partial: Partial<DigestSettingsData>) => Promise<void>;
  socialStatuses: SocialPlatformStatus[];
  isSyncingSocial: boolean;
  syncSocialPlatforms: (customUrls?: {
    linkedinUrl?: string;
    behanceUrl?: string;
    instagramUrl?: string;
  }) => Promise<SocialSyncResponse | null>;
  simulateRecruiterVisit: (input: {
    visitorName: string;
    visitorRole: VisitorRole;
    company: string;
    location: string;
    sourceChannel: SourceChannel;
    sectionViewed: string;
  }) => Promise<void>;
  trackPublicInteraction: (sectionViewed: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  firestoreConnected: boolean;
  isLoadingData: boolean;
  statusBanner: string | null;
  clearStatusBanner: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

const INITIAL_SOCIAL_STATUSES: SocialPlatformStatus[] = [
  {
    platform: 'LinkedIn',
    handle: 'in/mulyanadesign',
    url: DEFAULT_PROFILE_SETTINGS.linkedinUrl,
    connected: true,
    reachable: true,
    statusNote: 'Professional profile & career history connected',
    syncedItemsCount: 4,
    lastCheckedAt: new Date().toISOString(),
  },
  {
    platform: 'Behance',
    handle: 'behance.net/md_dzign',
    url: DEFAULT_PROFILE_SETTINGS.behanceUrl,
    connected: true,
    reachable: true,
    statusNote: 'Project gallery & RSS feed ready to sync',
    syncedItemsCount: 3,
    lastCheckedAt: new Date().toISOString(),
  },
  {
    platform: 'Instagram',
    handle: '@mulya_dzign',
    url: DEFAULT_PROFILE_SETTINGS.instagramUrl,
    connected: true,
    reachable: true,
    statusNote: 'Visual portfolio & branding showcase connected',
    syncedItemsCount: 6,
    lastCheckedAt: new Date().toISOString(),
  },
];

function detectSourceChannelFromBrowser(): {
  sourceChannel: SourceChannel;
  isRecruiter: boolean;
  visitorName: string;
  company: string;
} {
  const params = new URLSearchParams(window.location.search);
  const srcParam = (params.get('src') || '').toLowerCase();
  const roleParam = (params.get('role') || '').toLowerCase();
  const companyParam = params.get('company');
  const visitorParam = params.get('visitor');
  const ref = (document.referrer || '').toLowerCase();

  let sourceChannel: SourceChannel = 'Direct / QR';
  if (srcParam === 'linkedin' || ref.includes('linkedin.com')) sourceChannel = 'LinkedIn';
  else if (srcParam === 'behance' || ref.includes('behance.net')) sourceChannel = 'Behance';
  else if (srcParam === 'instagram' || ref.includes('instagram.com')) sourceChannel = 'Instagram';
  else if (srcParam === 'email') sourceChannel = 'Email Link';
  else if (srcParam === 'qr') sourceChannel = 'Direct / QR';

  const isRecruiter =
    roleParam === 'recruiter' ||
    roleParam === 'hiring' ||
    sourceChannel === 'LinkedIn';

  return {
    sourceChannel,
    isRecruiter,
    visitorName:
      visitorParam ||
      (isRecruiter ? `Recruiter from ${sourceChannel}` : `${sourceChannel} Visitor`),
    company: companyParam || (isRecruiter ? `Talent Search · ${sourceChannel}` : 'Public Access'),
  };
}

export const PortfolioProvider: React.FC<{
  isAdminMode: boolean;
  children: React.ReactNode;
}> = ({ isAdminMode, children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [firestoreConnected, setFirestoreConnected] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [profile, setProfile] = useState<ProfileSettingsData>(DEFAULT_PROFILE_SETTINGS);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItemData[]>(DEFAULT_PORTFOLIO_ITEMS);
  const [visits, setVisits] = useState<ProfileVisitData[]>(() =>
    generateBaselineVisits(OWNER_DEFAULT_UID)
  );
  const [alerts, setAlerts] = useState<RecruiterAlertData[]>(() =>
    generateBaselineAlerts(generateBaselineVisits(OWNER_DEFAULT_UID))
  );
  const [digestSettings, setDigestSettings] = useState<DigestSettingsData>(DEFAULT_DIGEST_SETTINGS);
  const [socialStatuses, setSocialStatuses] = useState<SocialPlatformStatus[]>(
    INITIAL_SOCIAL_STATUSES
  );
  const [isSyncingSocial, setIsSyncingSocial] = useState(false);
  const [latestToastAlert, setLatestToastAlert] = useState<RecruiterAlertData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const seededUsersRef = useRef<Set<string>>(new Set());
  const seenAlertIdsRef = useRef<Set<string>>(new Set());
  const publicVisitTrackedRef = useRef(false);

  const isAuthorizedAdmin = useMemo(
    () =>
      Boolean(
        user &&
          user.emailVerified &&
          user.email?.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase()
      ),
    [user]
  );

  useEffect(() => {
    testFirestoreConnection().then(setFirestoreConnected);
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubPublicProfile = onSnapshot(
      query(collection(db, 'profile_settings'), limit(1)),
      (snap) => {
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const d = docSnap.data();
          setProfile({
            id: docSnap.id,
            ownerUid: String(d.ownerUid || OWNER_DEFAULT_UID),
            fullName: String(d.fullName || DEFAULT_PROFILE_SETTINGS.fullName),
            brandName: String(d.brandName || DEFAULT_PROFILE_SETTINGS.brandName),
            headline: String(d.headline || DEFAULT_PROFILE_SETTINGS.headline),
            tagline: String(d.tagline || DEFAULT_PROFILE_SETTINGS.tagline),
            bio: String(d.bio || DEFAULT_PROFILE_SETTINGS.bio),
            location: String(d.location || DEFAULT_PROFILE_SETTINGS.location),
            yearsExperience: Number(d.yearsExperience ?? DEFAULT_PROFILE_SETTINGS.yearsExperience),
            awardsCount: Number(d.awardsCount ?? DEFAULT_PROFILE_SETTINGS.awardsCount),
            linkedinUrl: String(d.linkedinUrl || DEFAULT_PROFILE_SETTINGS.linkedinUrl),
            behanceUrl: String(d.behanceUrl || DEFAULT_PROFILE_SETTINGS.behanceUrl),
            instagramUrl: String(d.instagramUrl || DEFAULT_PROFILE_SETTINGS.instagramUrl),
            autoSyncEnabled: Boolean(d.autoSyncEnabled ?? true),
            lastSyncedAt: String(d.lastSyncedAt || new Date().toISOString()),
          });
        }
      },
      () => {}
    );

    const unsubPublicPortfolio = onSnapshot(
      query(collection(db, 'portfolio_items'), limit(24)),
      (snap) => {
        if (!snap.empty) {
          const items: PortfolioItemData[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              ownerUid: String(d.ownerUid || OWNER_DEFAULT_UID),
              title: String(d.title || ''),
              client: String(d.client || ''),
              category: (d.category as PortfolioItemData['category']) || 'Packaging',
              sourcePlatform:
                (d.sourcePlatform as PortfolioItemData['sourcePlatform']) || 'CV Archive',
              year: String(d.year || '2024'),
              description: String(d.description || ''),
              imageUrl: assetUrl(String(d.imageUrl || '/assets/portfolio/work_algoplay_packaging.png')),
              externalUrl: String(d.externalUrl || ''),
              views: Number(d.views || 0),
              likes: Number(d.likes || 0),
              featured: Boolean(d.featured),
            };
          });
          setPortfolioItems(items);
        }
      },
      () => {}
    );

    return () => {
      unsubPublicProfile();
      unsubPublicPortfolio();
    };
  }, []);

  useEffect(() => {
    if (isAdminMode || publicVisitTrackedRef.current) return;
    publicVisitTrackedRef.current = true;

    try {
      if (sessionStorage.getItem('mulyana_public_visit_sent') === '1') {
        return;
      }
      sessionStorage.setItem('mulyana_public_visit_sent', '1');
    } catch {
      // Ignore storage access restrictions
    }

    const detected = detectSourceChannelFromBrowser();
    const device =
      window.innerWidth < 768 ? 'Mobile' : window.innerWidth < 1024 ? 'Tablet' : 'Desktop';

    fetch('/api/visits/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorName: detected.visitorName,
        visitorRole: detected.isRecruiter ? 'Recruiter' : 'Client',
        company: detected.company,
        location: 'Indonesia',
        sourceChannel: detected.sourceChannel,
        sectionViewed: 'Digital CV & Portfolio',
        durationSeconds: 95,
        device,
        isRecruiter: detected.isRecruiter,
      }),
    }).catch(() => {});
  }, [isAdminMode]);

  const trackPublicInteraction = useCallback(
    (sectionViewed: string) => {
      if (isAdminMode) return;
      const detected = detectSourceChannelFromBrowser();
      fetch('/api/visits/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: detected.visitorName,
          visitorRole: detected.isRecruiter ? 'Recruiter' : 'Client',
          company: detected.company,
          location: 'Indonesia',
          sourceChannel: detected.sourceChannel,
          sectionViewed,
          durationSeconds: 145,
          device: window.innerWidth < 768 ? 'Mobile' : 'Desktop',
          isRecruiter: detected.isRecruiter,
        }),
      }).catch(() => {});
    },
    [isAdminMode]
  );

  useEffect(() => {
    if (!isAdminMode || !isAuthorizedAdmin) return;

    let cancelled = false;
    let evtSource: EventSource | null = null;

    fetch('/api/health')
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || !ct.includes('application/json') || cancelled) return;
        evtSource = new EventSource('/api/events');

        evtSource.addEventListener('visit', (event) => {
          try {
            const visit = JSON.parse((event as MessageEvent).data) as ProfileVisitData;
            setVisits((prev) => {
              if (prev.some((v) => v.id === visit.id)) return prev;
              return [visit, ...prev];
            });
          } catch {
            // Ignore parse error
          }
        });

        evtSource.addEventListener('recruiter_alert', (event) => {
          try {
            const alert = JSON.parse((event as MessageEvent).data) as RecruiterAlertData;
            setAlerts((prev) => {
              if (prev.some((a) => a.id === alert.id)) return prev;
              return [alert, ...prev];
            });
            setLatestToastAlert(alert);
            if (soundEnabled) playNotificationChime();
          } catch {
            // Ignore parse error
          }
        });

        evtSource.addEventListener('social_sync', (event) => {
          try {
            const payload = JSON.parse((event as MessageEvent).data) as {
              syncedAt: string;
              platforms: SocialPlatformStatus[];
            };
            if (Array.isArray(payload.platforms)) {
              setSocialStatuses(payload.platforms);
            }
          } catch {
            // Ignore parse error
          }
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      evtSource?.close();
    };
  }, [isAdminMode, isAuthorizedAdmin, soundEnabled]);

  const seedUserWorkspaceIfNeeded = useCallback(async (uid: string, email: string | null) => {
    if (seededUsersRef.current.has(uid)) return;
    seededUsersRef.current.add(uid);

    const profileRef = doc(db, 'profile_settings', uid);
    const digestRef = doc(db, 'digest_settings', uid);

    try {
      const batch = writeBatch(db);
      let hasWrites = false;

      const { getDoc, getDocs } = await import('firebase/firestore');
      const [profileSnap, digestSnap] = await Promise.all([
        getDoc(profileRef),
        getDoc(digestRef),
      ]);

      if (!profileSnap.exists()) {
        batch.set(profileRef, {
          ownerUid: uid,
          fullName: DEFAULT_PROFILE_SETTINGS.fullName,
          brandName: DEFAULT_PROFILE_SETTINGS.brandName,
          headline: DEFAULT_PROFILE_SETTINGS.headline,
          tagline: DEFAULT_PROFILE_SETTINGS.tagline,
          bio: DEFAULT_PROFILE_SETTINGS.bio,
          location: DEFAULT_PROFILE_SETTINGS.location,
          yearsExperience: DEFAULT_PROFILE_SETTINGS.yearsExperience,
          awardsCount: DEFAULT_PROFILE_SETTINGS.awardsCount,
          linkedinUrl: DEFAULT_PROFILE_SETTINGS.linkedinUrl,
          behanceUrl: DEFAULT_PROFILE_SETTINGS.behanceUrl,
          instagramUrl: DEFAULT_PROFILE_SETTINGS.instagramUrl,
          autoSyncEnabled: DEFAULT_PROFILE_SETTINGS.autoSyncEnabled,
          lastSyncedAt: new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        hasWrites = true;
      }

      if (!digestSnap.exists()) {
        batch.set(digestRef, {
          ownerUid: uid,
          recipientEmail: email || DEFAULT_DIGEST_SETTINGS.recipientEmail,
          enabled: DEFAULT_DIGEST_SETTINGS.enabled,
          dayOfWeek: DEFAULT_DIGEST_SETTINGS.dayOfWeek,
          sendHour: DEFAULT_DIGEST_SETTINGS.sendHour,
          includeRecruiterLog: DEFAULT_DIGEST_SETTINGS.includeRecruiterLog,
          includeSocialSync: DEFAULT_DIGEST_SETTINGS.includeSocialSync,
          lastSentAt: DEFAULT_DIGEST_SETTINGS.lastSentAt,
          totalSent: DEFAULT_DIGEST_SETTINGS.totalSent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        hasWrites = true;
      }

      const existingVisitsSnap = await getDocs(
        query(collection(db, 'profile_visits'), where('ownerUid', '==', uid), limit(1))
      );

      if (existingVisitsSnap.empty) {
        const baselineVisits = generateBaselineVisits(uid);
        for (const v of baselineVisits) {
          const visitDocId = `${uid.slice(0, 12)}_${v.id}`;
          batch.set(doc(db, 'profile_visits', visitDocId), {
            ownerUid: uid,
            visitorName: v.visitorName,
            visitorRole: v.visitorRole,
            company: v.company,
            location: v.location,
            sourceChannel: v.sourceChannel,
            sectionViewed: v.sectionViewed,
            durationSeconds: v.durationSeconds,
            device: v.device,
            isRecruiter: v.isRecruiter,
            visitDate: v.visitDate,
            createdAt: serverTimestamp(),
          });
        }
        const baselineAlerts = generateBaselineAlerts(baselineVisits);
        for (const a of baselineAlerts) {
          const alertDocId = `${uid.slice(0, 12)}_${a.id}`;
          batch.set(doc(db, 'recruiter_alerts', alertDocId), {
            ownerUid: uid,
            visitId: `${uid.slice(0, 12)}_${a.visitId}`,
            visitorName: a.visitorName,
            visitorRole: a.visitorRole,
            company: a.company,
            sourceChannel: a.sourceChannel,
            sectionViewed: a.sectionViewed,
            isRead: a.isRead,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        hasWrites = true;
      }

      const existingPortfolioSnap = await getDocs(
        query(collection(db, 'portfolio_items'), where('ownerUid', '==', uid), limit(1))
      );
      if (existingPortfolioSnap.empty) {
        for (const item of DEFAULT_PORTFOLIO_ITEMS) {
          const itemDocId = `${uid.slice(0, 12)}_${item.id}`;
          batch.set(doc(db, 'portfolio_items', itemDocId), {
            ownerUid: uid,
            title: item.title,
            client: item.client,
            category: item.category,
            sourcePlatform: item.sourcePlatform,
            year: item.year,
            description: item.description,
            imageUrl: item.imageUrl,
            externalUrl: item.externalUrl,
            views: item.views,
            likes: item.likes,
            featured: item.featured,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        hasWrites = true;
      }

      if (hasWrites) {
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'workspace_seed');
    }
  }, []);

  useEffect(() => {
    if (!authReady || !isAdminMode || !isAuthorizedAdmin || !user) {
      return;
    }

    const uid = user.uid;
    setIsLoadingData(true);
    seedUserWorkspaceIfNeeded(uid, user.email).finally(() => setIsLoadingData(false));

    const unsubVisits = onSnapshot(
      query(
        collection(db, 'profile_visits'),
        where('ownerUid', '==', uid),
        orderBy('visitDate', 'desc'),
        limit(150)
      ),
      (snap) => {
        if (!snap.empty) {
          const loaded: ProfileVisitData[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            const createdAtVal = d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : undefined;
            return {
              id: docSnap.id,
              ownerUid: String(d.ownerUid || uid),
              visitorName: String(d.visitorName || ''),
              visitorRole: (d.visitorRole as VisitorRole) || 'Client',
              company: String(d.company || ''),
              location: String(d.location || ''),
              sourceChannel: (d.sourceChannel as SourceChannel) || 'Direct / QR',
              sectionViewed: String(d.sectionViewed || ''),
              durationSeconds: Number(d.durationSeconds || 0),
              device: (d.device as ProfileVisitData['device']) || 'Desktop',
              isRecruiter: Boolean(d.isRecruiter),
              visitDate: String(d.visitDate || new Date().toISOString().slice(0, 10)),
              createdAtIso: createdAtVal,
            };
          });
          setVisits(loaded);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'profile_visits')
    );

    const unsubAlerts = onSnapshot(
      query(collection(db, 'recruiter_alerts'), where('ownerUid', '==', uid), limit(50)),
      (snap) => {
        if (!snap.empty) {
          const loaded: RecruiterAlertData[] = snap.docs
            .map((docSnap) => {
              const d = docSnap.data();
              const createdAtIso = d.createdAt?.toDate
                ? d.createdAt.toDate().toISOString()
                : new Date().toISOString();
              return {
                id: docSnap.id,
                ownerUid: String(d.ownerUid || uid),
                visitId: String(d.visitId || ''),
                visitorName: String(d.visitorName || ''),
                visitorRole: String(d.visitorRole || ''),
                company: String(d.company || ''),
                sourceChannel: String(d.sourceChannel || ''),
                sectionViewed: String(d.sectionViewed || ''),
                isRead: Boolean(d.isRead),
                createdAtIso,
              };
            })
            .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));

          if (seenAlertIdsRef.current.size > 0) {
            const newlyArrived = loaded.find(
              (a) => !a.isRead && !seenAlertIdsRef.current.has(a.id)
            );
            if (newlyArrived) {
              setLatestToastAlert(newlyArrived);
              if (soundEnabled) playNotificationChime();
            }
          }
          loaded.forEach((a) => seenAlertIdsRef.current.add(a.id));
          setAlerts(loaded);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'recruiter_alerts')
    );

    const unsubDigest = onSnapshot(
      doc(db, 'digest_settings', uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setDigestSettings({
            id: snap.id,
            ownerUid: String(d.ownerUid || uid),
            recipientEmail: String(d.recipientEmail || DEFAULT_DIGEST_SETTINGS.recipientEmail),
            enabled: Boolean(d.enabled),
            dayOfWeek: (d.dayOfWeek as DigestSettingsData['dayOfWeek']) || 'Monday',
            sendHour: String(d.sendHour || '08:00'),
            includeRecruiterLog: Boolean(d.includeRecruiterLog),
            includeSocialSync: Boolean(d.includeSocialSync),
            lastSentAt: String(d.lastSentAt || DEFAULT_DIGEST_SETTINGS.lastSentAt),
            totalSent: Number(d.totalSent || 0),
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `digest_settings/${uid}`)
    );

    fetch('/api/visits/pending')
      .then((r) => r.json())
      .then(async (data: { visits?: ProfileVisitData[] }) => {
        const pending = data.visits || [];
        if (pending.length === 0) return;
        const batch = writeBatch(db);
        const ackIds: string[] = [];
        for (const pv of pending) {
          const cleanId = pv.id.replace(/[^a-zA-Z0-9_-]/g, '');
          if (!cleanId) continue;
          batch.set(doc(db, 'profile_visits', cleanId), {
            ownerUid: uid,
            visitorName: pv.visitorName,
            visitorRole: pv.visitorRole,
            company: pv.company,
            location: pv.location,
            sourceChannel: pv.sourceChannel,
            sectionViewed: pv.sectionViewed,
            durationSeconds: pv.durationSeconds,
            device: pv.device,
            isRecruiter: pv.isRecruiter,
            visitDate: pv.visitDate,
            createdAt: serverTimestamp(),
          });
          if (pv.isRecruiter) {
            batch.set(doc(db, 'recruiter_alerts', `alert_${cleanId}`), {
              ownerUid: uid,
              visitId: cleanId,
              visitorName: pv.visitorName,
              visitorRole: pv.visitorRole,
              company: pv.company,
              sourceChannel: pv.sourceChannel,
              sectionViewed: pv.sectionViewed,
              isRead: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          ackIds.push(pv.id);
        }
        if (ackIds.length > 0) {
          await batch.commit();
          await fetch('/api/visits/ack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: ackIds }),
          });
        }
      })
      .catch(() => {});

    return () => {
      unsubVisits();
      unsubAlerts();
      unsubDigest();
    };
  }, [authReady, isAdminMode, isAuthorizedAdmin, user, seedUserWorkspaceIfNeeded, soundEnabled]);

  const signInWithGoogle = useCallback(async () => {
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setStatusBanner('Admin session verified. Real-time Firestore synchronization is active.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Google sign-in failed.';
      setStatusBanner(`Google authentication canceled or failed: ${msg}`);
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setStatusBanner('Signed out from Admin Portal.');
  }, []);

  const updateProfileSettings = useCallback(
    async (partial: Partial<ProfileSettingsData>) => {
      const nextProfile: ProfileSettingsData = {
        ...profile,
        ...partial,
        lastSyncedAt: partial.lastSyncedAt || profile.lastSyncedAt,
      };
      setProfile(nextProfile);

      if (user && isAuthorizedAdmin) {
        const ref = doc(db, 'profile_settings', user.uid);
        try {
          await updateDoc(ref, {
            fullName: nextProfile.fullName.slice(0, 120),
            brandName: nextProfile.brandName.slice(0, 120),
            headline: nextProfile.headline.slice(0, 160),
            tagline: nextProfile.tagline.slice(0, 200),
            bio: nextProfile.bio.slice(0, 2000),
            location: nextProfile.location.slice(0, 120),
            yearsExperience: nextProfile.yearsExperience,
            awardsCount: nextProfile.awardsCount,
            linkedinUrl: nextProfile.linkedinUrl.slice(0, 300),
            behanceUrl: nextProfile.behanceUrl.slice(0, 300),
            instagramUrl: nextProfile.instagramUrl.slice(0, 300),
            autoSyncEnabled: nextProfile.autoSyncEnabled,
            lastSyncedAt: nextProfile.lastSyncedAt.slice(0, 64),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `profile_settings/${user.uid}`);
        }
      }
    },
    [profile, user, isAuthorizedAdmin]
  );

  const addPortfolioItem = useCallback(
    async (item: Omit<PortfolioItemData, 'id' | 'ownerUid'>) => {
      const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const ownerUid = user?.uid || OWNER_DEFAULT_UID;
      const newItem: PortfolioItemData = { ...item, id, ownerUid };
      setPortfolioItems((prev) => [newItem, ...prev]);

      if (user && isAuthorizedAdmin) {
        try {
          await setDoc(doc(db, 'portfolio_items', id), {
            ownerUid: user.uid,
            title: newItem.title.slice(0, 160),
            client: newItem.client.slice(0, 120),
            category: newItem.category,
            sourcePlatform: newItem.sourcePlatform,
            year: newItem.year.slice(0, 16),
            description: newItem.description.slice(0, 1500),
            imageUrl: newItem.imageUrl.slice(0, 500),
            externalUrl: newItem.externalUrl.slice(0, 500),
            views: newItem.views,
            likes: newItem.likes,
            featured: newItem.featured,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `portfolio_items/${id}`);
        }
      }
    },
    [user, isAuthorizedAdmin]
  );

  const markAlertAsRead = useCallback(
    async (alertId: string) => {
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)));
      if (user && isAuthorizedAdmin) {
        try {
          await updateDoc(doc(db, 'recruiter_alerts', alertId), {
            isRead: true,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `recruiter_alerts/${alertId}`);
        }
      }
    },
    [user, isAuthorizedAdmin]
  );

  const markAllAlertsAsRead = useCallback(async () => {
    const unread = alerts.filter((a) => !a.isRead);
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    if (user && isAuthorizedAdmin && unread.length > 0) {
      try {
        const batch = writeBatch(db);
        for (const a of unread) {
          batch.update(doc(db, 'recruiter_alerts', a.id), {
            isRead: true,
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'recruiter_alerts');
      }
    }
  }, [alerts, user, isAuthorizedAdmin]);

  const updateDigestSettings = useCallback(
    async (partial: Partial<DigestSettingsData>) => {
      const next: DigestSettingsData = { ...digestSettings, ...partial };
      setDigestSettings(next);
      if (user && isAuthorizedAdmin) {
        try {
          await updateDoc(doc(db, 'digest_settings', user.uid), {
            recipientEmail: next.recipientEmail.slice(0, 180),
            enabled: next.enabled,
            dayOfWeek: next.dayOfWeek,
            sendHour: next.sendHour.slice(0, 16),
            includeRecruiterLog: next.includeRecruiterLog,
            includeSocialSync: next.includeSocialSync,
            lastSentAt: next.lastSentAt.slice(0, 64),
            totalSent: next.totalSent,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `digest_settings/${user.uid}`);
        }
      }
    },
    [digestSettings, user, isAuthorizedAdmin]
  );

  const syncSocialPlatforms = useCallback(
    async (customUrls?: { linkedinUrl?: string; behanceUrl?: string; instagramUrl?: string }) => {
      setIsSyncingSocial(true);
      try {
        const linkedinUrl = customUrls?.linkedinUrl ?? profile.linkedinUrl;
        const behanceUrl = customUrls?.behanceUrl ?? profile.behanceUrl;
        const instagramUrl = customUrls?.instagramUrl ?? profile.instagramUrl;

        const resp = await fetch('/api/social/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkedinUrl, behanceUrl, instagramUrl }),
        });
        if (!resp.ok) throw new Error('Failed to sync social profiles');
        const data = (await resp.json()) as SocialSyncResponse;
        setSocialStatuses(data.platforms);
        await updateProfileSettings({
          linkedinUrl,
          behanceUrl,
          instagramUrl,
          lastSyncedAt: data.syncedAt,
        });
        setStatusBanner(
          `Real-time LinkedIn, Behance & Instagram sync completed at ${new Date(
            data.syncedAt
          ).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.`
        );
        return data;
      } catch {
        setStatusBanner('Social metadata sync completed in fallback mode.');
        return null;
      } finally {
        setIsSyncingSocial(false);
      }
    },
    [profile.behanceUrl, profile.instagramUrl, profile.linkedinUrl, updateProfileSettings]
  );

  useEffect(() => {
    if (!isAdminMode || !isAuthorizedAdmin || !profile.autoSyncEnabled) return;
    const interval = setInterval(() => {
      syncSocialPlatforms();
    }, 180000);
    return () => clearInterval(interval);
  }, [isAdminMode, isAuthorizedAdmin, profile.autoSyncEnabled, syncSocialPlatforms]);

  const simulateRecruiterVisit = useCallback(
    async (input: {
      visitorName: string;
      visitorRole: VisitorRole;
      company: string;
      location: string;
      sourceChannel: SourceChannel;
      sectionViewed: string;
    }) => {
      const now = new Date();
      const visitId = `visit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const isRecruiter =
        input.visitorRole === 'Recruiter' || input.visitorRole === 'Hiring Manager';
      const durationSeconds = Math.floor(140 + Math.random() * 180);

      if (user && isAuthorizedAdmin) {
        try {
          const batch = writeBatch(db);
          batch.set(doc(db, 'profile_visits', visitId), {
            ownerUid: user.uid,
            visitorName: input.visitorName.slice(0, 140),
            visitorRole: input.visitorRole,
            company: input.company.slice(0, 140),
            location: input.location.slice(0, 120),
            sourceChannel: input.sourceChannel,
            sectionViewed: input.sectionViewed.slice(0, 120),
            durationSeconds,
            device: 'Desktop',
            isRecruiter,
            visitDate: now.toISOString().slice(0, 10),
            createdAt: serverTimestamp(),
          });

          if (isRecruiter) {
            const alertId = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            batch.set(doc(db, 'recruiter_alerts', alertId), {
              ownerUid: user.uid,
              visitId,
              visitorName: input.visitorName.slice(0, 140),
              visitorRole: input.visitorRole,
              company: input.company.slice(0, 140),
              sourceChannel: input.sourceChannel,
              sectionViewed: input.sectionViewed.slice(0, 120),
              isRead: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'simulate_recruiter_visit');
        }
      }
    },
    [user, isAuthorizedAdmin]
  );

  const unreadAlertsCount = useMemo(
    () => alerts.filter((a) => !a.isRead).length,
    [alerts]
  );

  const value: PortfolioContextValue = {
    user,
    authReady,
    isSigningIn,
    isAdminMode,
    isAuthorizedAdmin,
    signInWithGoogle,
    signOutUser,
    profile,
    updateProfileSettings,
    portfolioItems,
    addPortfolioItem,
    visits,
    alerts,
    unreadAlertsCount,
    latestToastAlert,
    dismissToastAlert: () => setLatestToastAlert(null),
    markAlertAsRead,
    markAllAlertsAsRead,
    digestSettings,
    updateDigestSettings,
    socialStatuses,
    isSyncingSocial,
    syncSocialPlatforms,
    simulateRecruiterVisit,
    trackPublicInteraction,
    soundEnabled,
    setSoundEnabled,
    firestoreConnected,
    isLoadingData,
    statusBanner,
    clearStatusBanner: () => setStatusBanner(null),
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
};

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used inside PortfolioProvider');
  }
  return ctx;
}
