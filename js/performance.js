'use strict';

/* Optimización progresiva: no cambia mecánicas, reduce trabajo visual y de red. */
function _perfApply(root = document) {
  root.querySelectorAll?.('img:not([loading])').forEach(img => { img.loading = 'lazy'; img.decoding = 'async'; });
}
function initPerformanceUX() {
  _perfApply();
  const slow = navigator.connection?.saveData || ['slow-2g','2g'].includes(navigator.connection?.effectiveType);
  document.documentElement.classList.toggle('performance-lite', !!slow);
  const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => { if (node.nodeType === 1) _perfApply(node); })));
  observer.observe(document.body, { childList:true, subtree:true });
  window.addEventListener('online', () => document.documentElement.classList.remove('is-offline'));
  window.addEventListener('offline', () => document.documentElement.classList.add('is-offline'));
  document.documentElement.classList.toggle('is-offline', !navigator.onLine);
}
