import { useState, useEffect } from "react";

const STORAGE_KEY = "acc_chain_certificates_v2";

/**
 * usePersistentCerts
 * Wraps useState with localStorage so certificates survive page refresh.
 * Falls back gracefully if localStorage is unavailable.
 */
export function usePersistentCerts() {
  const [certificates, setCertificatesRaw] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wrap setter so every update also persists to localStorage
  function setCertificates(updater) {
    setCertificatesRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* storage full or unavailable */ }
      return next;
    });
  }

  // Merge new certs from blockchain without duplicating by enrolmentNumber
  function mergeCertificates(incoming) {
    setCertificates(prev => {
      const enrolSet = new Set(prev.map(c => c.enrolmentNumber));
      const fresh = incoming.filter(c => !enrolSet.has(c.enrolmentNumber));
      return [...prev, ...fresh];
    });
  }

  function clearCertificates() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setCertificatesRaw([]);
  }

  return { certificates, setCertificates, mergeCertificates, clearCertificates };
}
