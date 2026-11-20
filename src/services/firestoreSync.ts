import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  INITIAL_CHECKLIST,
  INITIAL_KEYWORDS,
  INITIAL_LEADS,
  INITIAL_SEO_SAMPLE,
} from '../data/seedData';
import type {
  AuditHeadingNode,
  AuditImageItem,
  AuditSeverity,
  ChecklistItem,
  ClientLead,
  KeywordRank,
  LeadAutomationStatus,
  SeoAuditResult,
  SeoPackage,
} from '../types';

function clampStr(val: string | undefined, maxLen: number, fallback = ''): string {
  const clean = (val ?? fallback).trim();
  if (!clean) return fallback.slice(0, maxLen);
  return clean.slice(0, maxLen);
}

function sanitizeId(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9_-]/g, '-');
  return clean.slice(0, 64) || `id-${Date.now()}`;
}

export async function ensureUserWorkspace(user: User): Promise<{ webhookUrl: string; isNewUser: boolean }> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  let isNewUser = false;
  let webhookUrl = '';

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      isNewUser = true;
      await setDoc(userRef, {
        uid: user.uid,
        displayName: clampStr(user.displayName || 'Workspace Member', 120, 'Workspace Member'),
        email: clampStr(user.email || '', 180, 'user@example.com'),
        photoURL: clampStr(user.photoURL || '', 500, ''),
        webhookUrl: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const data = snap.data() as { webhookUrl?: string };
      webhookUrl = data.webhookUrl || '';
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  // Seed initial starter workspace collections if user has no leads/keywords/checklist yet
  try {
    const leadsRef = collection(db, 'users', user.uid, 'leads');
    const existingLeads = await getDocs(
      query(leadsRef, where('ownerId', '==', user.uid), limit(1))
    );
    if (existingLeads.empty) {
      const batch = writeBatch(db);

      for (const lead of INITIAL_LEADS) {
        const lid = sanitizeId(lead.id);
        batch.set(doc(db, 'users', user.uid, 'leads', lid), {
          id: lid,
          ownerId: user.uid,
          companyName: clampStr(lead.companyName, 160),
          contactName: clampStr(lead.contactName, 120),
          email: clampStr(lead.email, 180),
          phone: clampStr(lead.phone, 40, '+91 98260 00100'),
          region: clampStr(lead.region, 100, 'PAN India (Multi-City)'),
          serviceTrack: lead.serviceTrack,
          requirement: clampStr(lead.requirement, 1000),
          priorityTag: lead.priorityTag,
          status: lead.status,
          dispatchedChannels: clampStr(lead.dispatchedChannels, 80, 'WhatsApp + Email'),
          whatsappPreview: clampStr(lead.whatsappPreview, 1500),
          emailSubject: clampStr(lead.emailSubject, 240),
          emailBody: clampStr(lead.emailBody, 3000),
          createdAtLabel: clampStr(lead.createdAt, 60, 'Today'),
          webhookSynced: Boolean(lead.webhookSynced),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const kw of INITIAL_KEYWORDS) {
        const kid = sanitizeId(kw.id);
        batch.set(doc(db, 'users', user.uid, 'keywords', kid), {
          id: kid,
          ownerId: user.uid,
          keyword: clampStr(kw.keyword, 200),
          category: kw.category,
          rank: Math.max(1, Math.min(100, Math.round(kw.rank))),
          previousRank: Math.max(1, Math.min(200, Math.round(kw.previousRank))),
          monthlyVolume: Math.max(0, Math.min(10000000, Math.round(kw.monthlyVolume))),
          targetUrl: clampStr(kw.targetUrl, 240, '/services'),
          intent: kw.intent,
          lastUpdated: clampStr(kw.lastUpdated, 60, 'Today'),
          createdAt: serverTimestamp(),
        });
      }

      for (const item of INITIAL_CHECKLIST) {
        const cid = sanitizeId(item.id);
        batch.set(doc(db, 'users', user.uid, 'checklist', cid), {
          id: cid,
          ownerId: user.uid,
          title: clampStr(item.title, 200),
          description: clampStr(item.description, 600),
          category: item.category,
          region: clampStr(item.region, 100, 'PAN India'),
          cadence: clampStr(item.cadence, 60, 'Weekly'),
          impact: item.impact,
          completed: Boolean(item.completed),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const sid = sanitizeId(INITIAL_SEO_SAMPLE.id);
      batch.set(doc(db, 'users', user.uid, 'seoPackages', sid), {
        id: sid,
        ownerId: user.uid,
        serviceName: clampStr(INITIAL_SEO_SAMPLE.serviceName, 160),
        targetLocation: clampStr(INITIAL_SEO_SAMPLE.targetLocation, 120),
        category: clampStr(INITIAL_SEO_SAMPLE.category, 120),
        pageTitle: clampStr(INITIAL_SEO_SAMPLE.pageTitle, 80),
        metaDescription: clampStr(INITIAL_SEO_SAMPLE.metaDescription, 200),
        lsiKeywords: INITIAL_SEO_SAMPLE.lsiKeywords.slice(0, 15).map((k) => clampStr(k, 120)),
        urlSlug: clampStr(INITIAL_SEO_SAMPLE.urlSlug, 200, '/services'),
        schemaJsonLd: clampStr(INITIAL_SEO_SAMPLE.schemaJsonLd, 6000, '{}'),
        createdAtLabel: clampStr(INITIAL_SEO_SAMPLE.createdAt, 60, 'Pre-loaded Example'),
        createdAt: serverTimestamp(),
      });

      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${userPath}/leads`);
  }

  return { webhookUrl, isNewUser };
}

export function subscribeUserCollections(
  uid: string,
  callbacks: {
    onLeads: (leads: ClientLead[]) => void;
    onKeywords: (keywords: KeywordRank[]) => void;
    onSeoPackages: (pkgs: SeoPackage[]) => void;
    onChecklist: (items: ChecklistItem[]) => void;
    onSeoAudits?: (audits: SeoAuditResult[]) => void;
  }
): () => void {
  const leadsPath = `users/${uid}/leads`;
  const keywordsPath = `users/${uid}/keywords`;
  const seoPath = `users/${uid}/seoPackages`;
  const checklistPath = `users/${uid}/checklist`;
  const auditsPath = `users/${uid}/seoAudits`;

  const unsubLeads = onSnapshot(
    query(
      collection(db, 'users', uid, 'leads'),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => {
      const items: ClientLead[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: String(data.id || d.id),
          companyName: String(data.companyName || ''),
          contactName: String(data.contactName || ''),
          email: String(data.email || ''),
          phone: String(data.phone || ''),
          region: String(data.region || 'PAN India (Multi-City)'),
          serviceTrack: data.serviceTrack as ClientLead['serviceTrack'],
          requirement: String(data.requirement || ''),
          priorityTag: 'Priority #1 VIP',
          status: data.status as LeadAutomationStatus,
          dispatchedChannels: String(data.dispatchedChannels || 'WhatsApp + Email'),
          whatsappPreview: String(data.whatsappPreview || ''),
          emailSubject: String(data.emailSubject || ''),
          emailBody: String(data.emailBody || ''),
          createdAt: String(data.createdAtLabel || 'Recently'),
          webhookSynced: Boolean(data.webhookSynced),
        };
      });
      callbacks.onLeads(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, leadsPath)
  );

  const unsubKeywords = onSnapshot(
    query(
      collection(db, 'users', uid, 'keywords'),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => {
      const items: KeywordRank[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: String(data.id || d.id),
          keyword: String(data.keyword || ''),
          category: data.category as KeywordRank['category'],
          rank: Number(data.rank || 1),
          previousRank: Number(data.previousRank || 1),
          monthlyVolume: Number(data.monthlyVolume || 0),
          targetUrl: String(data.targetUrl || '/services'),
          intent: data.intent as KeywordRank['intent'],
          lastUpdated: String(data.lastUpdated || 'Today'),
        };
      });
      callbacks.onKeywords(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, keywordsPath)
  );

  const unsubSeo = onSnapshot(
    query(
      collection(db, 'users', uid, 'seoPackages'),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => {
      const items: SeoPackage[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: String(data.id || d.id),
          serviceName: String(data.serviceName || ''),
          targetLocation: String(data.targetLocation || 'PAN India'),
          category: String(data.category || ''),
          pageTitle: String(data.pageTitle || ''),
          metaDescription: String(data.metaDescription || ''),
          lsiKeywords: Array.isArray(data.lsiKeywords)
            ? data.lsiKeywords.map(String)
            : [],
          urlSlug: String(data.urlSlug || '/services'),
          schemaJsonLd: String(data.schemaJsonLd || '{}'),
          createdAt: String(data.createdAtLabel || 'Saved'),
        };
      });
      if (items.length > 0) {
        callbacks.onSeoPackages(items);
      }
    },
    (error) => handleFirestoreError(error, OperationType.LIST, seoPath)
  );

  const unsubChecklist = onSnapshot(
    query(
      collection(db, 'users', uid, 'checklist'),
      where('ownerId', '==', uid),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => {
      const items: ChecklistItem[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: String(data.id || d.id),
          title: String(data.title || ''),
          description: String(data.description || ''),
          category: data.category as ChecklistItem['category'],
          region: String(data.region || 'PAN India'),
          cadence: String(data.cadence || 'Weekly'),
          impact: data.impact as ChecklistItem['impact'],
          completed: Boolean(data.completed),
        };
      });
      callbacks.onChecklist(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, checklistPath)
  );

  const unsubAudits = callbacks.onSeoAudits
    ? onSnapshot(
        query(
          collection(db, 'users', uid, 'seoAudits'),
          where('ownerId', '==', uid),
          orderBy('createdAt', 'desc'),
          limit(15)
        ),
        (snapshot) => {
          const items: SeoAuditResult[] = snapshot.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            const rawSkipped = Array.isArray(data.skippedTransitions)
              ? data.skippedTransitions.map(String).filter((s) => s !== '__NONE__')
              : [];
            const rawNodes = Array.isArray(data.headingNodesEncoded)
              ? data.headingNodesEncoded.map(String).filter((s) => s !== '__NONE__')
              : [];
            const rawImages = Array.isArray(data.imageItemsEncoded)
              ? data.imageItemsEncoded.map(String).filter((s) => s !== '__NONE__')
              : [];

            const nodes: AuditHeadingNode[] = rawNodes
              .map((entry) => {
                const sep = entry.indexOf('\t');
                const lvl = Number(sep > -1 ? entry.slice(0, sep) : '2');
                const validLvl = (lvl >= 1 && lvl <= 6 ? lvl : 2) as 1 | 2 | 3 | 4 | 5 | 6;
                const text = sep > -1 ? entry.slice(sep + 1) : entry;
                return { level: validLvl, text };
              })
              .filter((n) => Boolean(n.text));

            const imgItems: AuditImageItem[] = rawImages.map((entry) => {
              const parts = entry.split('\t');
              const st = parts[0];
              const status: AuditImageItem['status'] =
                st === 'valid' || st === 'empty' || st === 'missing' ? st : 'missing';
              return {
                status,
                src: parts[1] || '',
                alt: parts[2] || '',
              };
            });

            return {
              id: String(data.id || d.id),
              url: String(data.url || ''),
              finalUrl: String(data.finalUrl || data.url || ''),
              httpStatus: Number(data.httpStatus || 200),
              responseTimeMs: Number(data.responseTimeMs || 0),
              auditedAt: String(data.auditedAtLabel || 'Saved'),
              passedChecks: Number(data.passedChecks || 0),
              totalChecks: Number(data.totalChecks || 10),
              meta: {
                status: (data.metaStatus as AuditSeverity) || 'Warning',
                title: String(data.metaTitle || ''),
                titleLength: Number(data.metaTitleLength || 0),
                description: String(data.metaDescription || ''),
                descriptionLength: Number(data.metaDescriptionLength || 0),
                canonical: String(data.canonical || ''),
                robots: String(data.robots || ''),
                viewport: String(data.viewport || ''),
                ogTitle: String(data.ogTitle || ''),
                ogDescription: String(data.ogDescription || ''),
                ogImage: String(data.ogImage || ''),
                twitterCard: String(data.twitterCard || ''),
              },
              headings: {
                status: (data.headingsStatus as AuditSeverity) || 'Warning',
                totalCount: Number(data.headingsTotalCount || 0),
                h1Count: Number(data.h1Count || 0),
                h2Count: Number(data.h2Count || 0),
                h3Count: Number(data.h3Count || 0),
                h4Count: Number(data.h4Count || 0),
                h5Count: Number(data.h5Count || 0),
                h6Count: Number(data.h6Count || 0),
                skippedTransitions: rawSkipped,
                nodes,
              },
              images: {
                status: (data.imagesStatus as AuditSeverity) || 'Warning',
                totalCount: Number(data.imagesTotalCount || 0),
                withAltCount: Number(data.withAltCount || 0),
                emptyAltCount: Number(data.emptyAltCount || 0),
                missingAltCount: Number(data.missingAltCount || 0),
                items: imgItems,
              },
              recommendations: Array.isArray(data.recommendations)
                ? data.recommendations.map(String)
                : [],
            };
          });
          callbacks.onSeoAudits?.(items);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, auditsPath)
      )
    : () => {};

  return () => {
    unsubLeads();
    unsubKeywords();
    unsubSeo();
    unsubChecklist();
    unsubAudits();
  };
}

export async function saveLeadToFirestore(uid: string, lead: ClientLead): Promise<void> {
  const id = sanitizeId(lead.id);
  const path = `users/${uid}/leads/${id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'leads', id), {
      id,
      ownerId: uid,
      companyName: clampStr(lead.companyName, 160),
      contactName: clampStr(lead.contactName, 120),
      email: clampStr(lead.email, 180),
      phone: clampStr(lead.phone, 40, '+91 98260 00100'),
      region: clampStr(lead.region, 100, 'PAN India (Multi-City)'),
      serviceTrack: lead.serviceTrack,
      requirement: clampStr(lead.requirement, 1000),
      priorityTag: lead.priorityTag,
      status: lead.status,
      dispatchedChannels: clampStr(lead.dispatchedChannels, 80, 'WhatsApp + Email'),
      whatsappPreview: clampStr(lead.whatsappPreview, 1500),
      emailSubject: clampStr(lead.emailSubject, 240),
      emailBody: clampStr(lead.emailBody, 3000),
      createdAtLabel: clampStr(lead.createdAt, 60, 'Just now'),
      webhookSynced: Boolean(lead.webhookSynced),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLeadStatusInFirestore(
  uid: string,
  leadId: string,
  status: LeadAutomationStatus
): Promise<void> {
  const id = sanitizeId(leadId);
  const path = `users/${uid}/leads/${id}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'leads', id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveKeywordToFirestore(uid: string, kw: KeywordRank): Promise<void> {
  const id = sanitizeId(kw.id);
  const path = `users/${uid}/keywords/${id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'keywords', id), {
      id,
      ownerId: uid,
      keyword: clampStr(kw.keyword, 200),
      category: kw.category,
      rank: Math.max(1, Math.min(100, Math.round(kw.rank))),
      previousRank: Math.max(1, Math.min(200, Math.round(kw.previousRank))),
      monthlyVolume: Math.max(0, Math.min(10000000, Math.round(kw.monthlyVolume))),
      targetUrl: clampStr(kw.targetUrl, 240, '/services'),
      intent: kw.intent,
      lastUpdated: clampStr(kw.lastUpdated, 60, 'Just now'),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateKeywordRankInFirestore(
  uid: string,
  keywordId: string,
  rank: number,
  previousRank: number,
  lastUpdated: string
): Promise<void> {
  const id = sanitizeId(keywordId);
  const path = `users/${uid}/keywords/${id}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'keywords', id), {
      rank: Math.max(1, Math.min(100, Math.round(rank))),
      previousRank: Math.max(1, Math.min(200, Math.round(previousRank))),
      lastUpdated: clampStr(lastUpdated, 60, 'Just now'),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveSeoPackageToFirestore(uid: string, pkg: SeoPackage): Promise<void> {
  const id = sanitizeId(pkg.id);
  const path = `users/${uid}/seoPackages/${id}`;
  const cleanLsi = (pkg.lsiKeywords.length > 0 ? pkg.lsiKeywords : ['seo staffing india'])
    .slice(0, 15)
    .map((k) => clampStr(k, 120, 'keyword'));

  try {
    await setDoc(doc(db, 'users', uid, 'seoPackages', id), {
      id,
      ownerId: uid,
      serviceName: clampStr(pkg.serviceName, 160),
      targetLocation: clampStr(pkg.targetLocation, 120, 'PAN India'),
      category: clampStr(pkg.category, 120, 'HR Staffing'),
      pageTitle: clampStr(pkg.pageTitle, 80),
      metaDescription: clampStr(pkg.metaDescription, 200),
      lsiKeywords: cleanLsi,
      urlSlug: clampStr(pkg.urlSlug, 200, '/services'),
      schemaJsonLd: clampStr(pkg.schemaJsonLd, 6000, '{}'),
      createdAtLabel: clampStr(pkg.createdAt, 60, 'Saved'),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleChecklistInFirestore(
  uid: string,
  itemId: string,
  completed: boolean
): Promise<void> {
  const id = sanitizeId(itemId);
  const path = `users/${uid}/checklist/${id}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'checklist', id), {
      completed,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveChecklistItemToFirestore(
  uid: string,
  item: ChecklistItem
): Promise<void> {
  const id = sanitizeId(item.id);
  const path = `users/${uid}/checklist/${id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'checklist', id), {
      id,
      ownerId: uid,
      title: clampStr(item.title, 200),
      description: clampStr(item.description, 600),
      category: item.category,
      region: clampStr(item.region, 100, 'PAN India'),
      cadence: clampStr(item.cadence, 60, 'Monthly'),
      impact: item.impact,
      completed: Boolean(item.completed),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveWebhookUrlToFirestore(uid: string, webhookUrl: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      webhookUrl: clampStr(webhookUrl, 400, ''),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveSeoAuditToFirestore(uid: string, audit: SeoAuditResult): Promise<void> {
  const id = sanitizeId(audit.id);
  const path = `users/${uid}/seoAudits/${id}`;

  const skippedTransitions =
    audit.headings.skippedTransitions.length > 0
      ? audit.headings.skippedTransitions.slice(0, 20).map((s) => clampStr(s, 160, 'Skipped'))
      : ['__NONE__'];

  const headingNodesEncoded =
    audit.headings.nodes.length > 0
      ? audit.headings.nodes
          .slice(0, 30)
          .map((n) => `${n.level}\t${clampStr(n.text.replace(/\t+/g, ' '), 260, 'Heading')}`)
      : ['__NONE__'];

  const imageItemsEncoded =
    audit.images.items.length > 0
      ? audit.images.items
          .slice(0, 25)
          .map(
            (img) =>
              `${img.status}\t${clampStr(img.src.replace(/\t+/g, ' '), 320, 'image')}\t${clampStr(img.alt.replace(/\t+/g, ' '), 220, '')}`
          )
      : ['__NONE__'];

  const recommendations =
    audit.recommendations.length > 0
      ? audit.recommendations.slice(0, 20).map((r) => clampStr(r, 300, 'Audit completed.'))
      : ['All core on-page SEO checks passed.'];

  try {
    await setDoc(doc(db, 'users', uid, 'seoAudits', id), {
      id,
      ownerId: uid,
      url: clampStr(audit.url, 500, 'https://example.com'),
      finalUrl: clampStr(audit.finalUrl || audit.url, 500, 'https://example.com'),
      httpStatus: Math.max(100, Math.min(599, Math.round(audit.httpStatus))),
      responseTimeMs: Math.max(0, Math.min(120000, Math.round(audit.responseTimeMs))),
      auditedAtLabel: clampStr(audit.auditedAt, 60, 'Just now'),
      passedChecks: Math.max(0, Math.min(50, Math.round(audit.passedChecks))),
      totalChecks: Math.max(1, Math.min(50, Math.round(audit.totalChecks))),
      metaStatus: audit.meta.status,
      metaTitle: clampStr(audit.meta.title, 300, ''),
      metaTitleLength: Math.max(0, Math.min(500, Math.round(audit.meta.titleLength))),
      metaDescription: clampStr(audit.meta.description, 600, ''),
      metaDescriptionLength: Math.max(0, Math.min(1000, Math.round(audit.meta.descriptionLength))),
      canonical: clampStr(audit.meta.canonical, 500, ''),
      robots: clampStr(audit.meta.robots, 120, ''),
      viewport: clampStr(audit.meta.viewport, 200, ''),
      ogTitle: clampStr(audit.meta.ogTitle, 300, ''),
      ogDescription: clampStr(audit.meta.ogDescription, 600, ''),
      ogImage: clampStr(audit.meta.ogImage, 500, ''),
      twitterCard: clampStr(audit.meta.twitterCard, 120, ''),
      headingsStatus: audit.headings.status,
      headingsTotalCount: Math.max(0, Math.min(5000, Math.round(audit.headings.totalCount))),
      h1Count: Math.max(0, Math.min(1000, Math.round(audit.headings.h1Count))),
      h2Count: Math.max(0, Math.min(1000, Math.round(audit.headings.h2Count))),
      h3Count: Math.max(0, Math.min(1000, Math.round(audit.headings.h3Count))),
      h4Count: Math.max(0, Math.min(1000, Math.round(audit.headings.h4Count))),
      h5Count: Math.max(0, Math.min(1000, Math.round(audit.headings.h5Count))),
      h6Count: Math.max(0, Math.min(1000, Math.round(audit.headings.h6Count))),
      skippedTransitions,
      headingNodesEncoded,
      imagesStatus: audit.images.status,
      imagesTotalCount: Math.max(0, Math.min(5000, Math.round(audit.images.totalCount))),
      withAltCount: Math.max(0, Math.min(5000, Math.round(audit.images.withAltCount))),
      emptyAltCount: Math.max(0, Math.min(5000, Math.round(audit.images.emptyAltCount))),
      missingAltCount: Math.max(0, Math.min(5000, Math.round(audit.images.missingAltCount))),
      imageItemsEncoded,
      recommendations,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteSeoAuditFromFirestore(uid: string, auditId: string): Promise<void> {
  const id = sanitizeId(auditId);
  const path = `users/${uid}/seoAudits/${id}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'seoAudits', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
