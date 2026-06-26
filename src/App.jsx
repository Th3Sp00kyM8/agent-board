import { useState, useEffect, useRef } from 'react';
import { Plus, X, Edit2, Trash2, Copy, Download, Upload, Search, AlertTriangle, RotateCcw, Lock, ChevronDown, ChevronRight, ChevronLeft, Check, Calendar, Tag, FileText, ArrowRight, Palette, MessageSquare, Info, Target, Zap, AlertCircle, Save, WifiOff, Layers } from 'lucide-react';

const COLUMNS = ['To Do', 'Doing', 'In Review', 'Blocked', 'Done'];

const RELEASE_TIERS = [
  { id: 'core_release', label: 'Core Release', color: 'text-blue-300', bgColor: 'bg-blue-900/30', borderColor: 'border-blue-700/40' },
  { id: 'post_release', label: 'Post Release', color: 'text-amber-300', bgColor: 'bg-amber-900/30', borderColor: 'border-amber-700/40' },
  { id: 'future_content', label: 'Future Content', color: 'text-purple-300', bgColor: 'bg-purple-900/30', borderColor: 'border-purple-700/40' },
];

const SEVERITY_COLORS = {
  'Low': 'bg-slate-700 text-slate-300',
  'Medium': 'bg-amber-900/40 text-amber-300',
  'High': 'bg-orange-900/40 text-orange-300',
  'Critical': 'bg-red-900/40 text-red-300',
};

const SIZE_LABELS = { 'S': '~60 min', 'M': '~120 min', 'L': '~180 min', 'XL': '~240+ min' };

const COLUMN_COLORS = {
  'To Do': 'border-slate-600',
  'Doing': 'border-blue-600',
  'In Review': 'border-purple-600',
  'Blocked': 'border-red-700',
  'Done': 'border-green-700',
};

const SOURCE_LEGEND = [
  { label: 'User', color: 'bg-blue-500', match: 'user' },
  { label: 'Chat', color: 'bg-emerald-500', match: 'chat' },
  { label: 'AI Agent', color: 'bg-purple-500', match: 'ai / agent' },
  { label: 'Automation', color: 'bg-cyan-500', match: 'automation' },
  { label: 'Risk', color: 'bg-red-500', match: 'risk' },
  { label: 'Batch', color: 'bg-amber-500', match: 'batch' },
  { label: 'Other', color: 'bg-slate-600', match: 'default' },
];

const SCROLLBAR_STYLE = `
.tk-hscroll::-webkit-scrollbar { height: 14px; width: 10px; }
.tk-hscroll::-webkit-scrollbar-track { background: rgb(15 23 42); border-radius: 6px; border: 1px solid rgb(30 41 59); }
.tk-hscroll::-webkit-scrollbar-thumb { background: rgb(71 85 105); border-radius: 6px; border: 2px solid rgb(15 23 42); }
.tk-hscroll::-webkit-scrollbar-thumb:hover { background: rgb(100 116 139); }
.tk-vscroll::-webkit-scrollbar { width: 8px; }
.tk-vscroll::-webkit-scrollbar-track { background: transparent; }
.tk-vscroll::-webkit-scrollbar-thumb { background: rgb(51 65 85); border-radius: 4px; }
.tk-vscroll::-webkit-scrollbar-thumb:hover { background: rgb(71 85 105); }
`;

const DEFAULT_APP_CONFIG = {
  projectName: 'Agent Board',
  labels: { workstream: 'Workstream', cycle: 'Sprint' },
};

const DEFAULT_SPRINT_BOARD = {
  lastRoundLabel: 'Sprint 0',
  lastRoundSummary: 'Sprint summary...',
  currentRound: 'Sprint 1',
  currentRoundGoal: 'Sprint goal / scope...',
  nextRound: 'Sprint 2',
  nextRoundGoal: 'Planning notes...',
};

function sourceAccent(source) {
  const s = (source || '').toLowerCase();
  if (s.includes('ai') || s.includes('agent')) return 'border-l-purple-500';
  if (s.includes('review') || s.includes('qa')) return 'border-l-slate-400';
  if (s.includes('risk') || s.includes('block')) return 'border-l-red-500';
  if (s.includes('chat')) return 'border-l-emerald-500';
  if (s.includes('automation') || s.includes('code')) return 'border-l-cyan-500';
  if (s.includes('user') || s.includes('human')) return 'border-l-blue-500';
  if (s.includes('batch')) return 'border-l-amber-500';
  return 'border-l-slate-600';
}

function nowIso() { return new Date().toISOString(); }
function uid() { return Math.random().toString(36).slice(2, 11); }
function formatDate(iso) { if (!iso) return ''; return new Date(iso).toLocaleString(); }

// Migrate items missing releaseTier to default 'core_release'
function ensureReleaseTier(item) {
  if (!item.releaseTier) return { ...item, releaseTier: 'core_release' };
  return item;
}

function suggestNextPath(existingPaths) {
  const singletonAlphabetic = existingPaths.filter(p => /^[A-Z]{1,2}$/.test(p)).sort();
  if (singletonAlphabetic.length === 0) return 'A';
  const last = singletonAlphabetic[singletonAlphabetic.length - 1];
  if (last.length === 1) {
    if (last === 'Z') return 'AA';
    return String.fromCharCode(last.charCodeAt(0) + 1);
  }
  const first = last[0];
  const second = last[1];
  if (second === 'Z') {
    if (first === 'Z') return 'AAA';
    return String.fromCharCode(first.charCodeAt(0) + 1) + 'A';
  }
  return first + String.fromCharCode(second.charCodeAt(0) + 1);
}

function getStaleInfo(item) {
  if (item.column === 'Done' || item.column === 'To Do') return null;
  const enteredAt = item.columnEnteredAt || item.updatedAt;
  if (!enteredAt) return null;
  const daysSinceMove = (Date.now() - new Date(enteredAt).getTime()) / (1000 * 60 * 60 * 24);
  if (item.column === 'Doing') {
    if (daysSinceMove > 14) return { level: 'critical', days: Math.floor(daysSinceMove), reason: `In Doing ${Math.floor(daysSinceMove)} days` };
    if (daysSinceMove > 7) return { level: 'warning', days: Math.floor(daysSinceMove), reason: `In Doing ${Math.floor(daysSinceMove)} days` };
  } else if (item.column === 'In Review') {
    if (daysSinceMove > 5) return { level: 'warning', days: Math.floor(daysSinceMove), reason: `In Review ${Math.floor(daysSinceMove)} days` };
  } else if (item.column === 'Blocked') {
    if (daysSinceMove > 14) return { level: 'critical', days: Math.floor(daysSinceMove), reason: `Blocked ${Math.floor(daysSinceMove)} days` };
  }
  return null;
}

function deriveAgentStatus(items) {
  const doing = items.filter(i => i.column === 'Doing');
  let developer = null, aiAgent = null, reviewer = null;
  for (const item of doing) {
    const s = (item.source || '').toLowerCase();
    if (!aiAgent && (s.includes('ai') || s.includes('agent') || s.includes('assistant'))) aiAgent = item;
    else if (!reviewer && (s.includes('review') || s.includes('qa'))) reviewer = item;
    else if (!developer) developer = item;
  }
  return { developer, aiAgent, reviewer };
}

export default function App() {
  const [items, setItems] = useState([]);
  const [sprintBoard, setSprintBoard] = useState(DEFAULT_SPRINT_BOARD);
  const [appConfig, setAppConfig] = useState(DEFAULT_APP_CONFIG);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('connecting');
  const [serverError, setServerError] = useState('');
  const [search, setSearch] = useState('');
  const [filterColumn, setFilterColumn] = useState('All');
  const [filterPath, setFilterPath] = useState('');
  const [filterRound, setFilterRound] = useState('');
  const [filterSource, setFilterSource] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterReleaseTier, setFilterReleaseTier] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sprintExpanded, setSprintExpanded] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [copiedFlag, setCopiedFlag] = useState(false);
  const [syncFlag, setSyncFlag] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [showBulkMove, setShowBulkMove] = useState(false);
  const [showBulkTier, setShowBulkTier] = useState(false);
  const [showBulkRound, setShowBulkRound] = useState(false);
  const [bulkRoundValue, setBulkRoundValue] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  // Set of "column:tier" strings indicating collapsed sections
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());

  const saveTimeout = useRef(null);
  const scrollContainerRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    async function load() {
      try {
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const configData = await configRes.json();
          setAppConfig({ ...DEFAULT_APP_CONFIG, ...configData, labels: { ...DEFAULT_APP_CONFIG.labels, ...(configData.labels || {}) } });
        }
        const res = await fetch('/api/state');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          // Backward compat: ensure all items have releaseTier
          setItems(data.items.map(ensureReleaseTier));
        }
        if (data.sprintBoard) setSprintBoard({ ...DEFAULT_SPRINT_BOARD, ...data.sprintBoard });
        setServerStatus('ok');
      } catch (err) {
        console.error('Failed to load state:', err);
        setServerError(err.message);
        setServerStatus('error');
      }
      setLoading(false);
      setTimeout(() => { initialLoadRef.current = false; }, 100);
    }
    load();
  }, []);

  useEffect(() => {
    if (loading || initialLoadRef.current) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const res = await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, sprintBoard }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSaveStatus('saved');
        setLastSavedAt(data.savedAt);
        setServerStatus('ok');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (err) {
        console.error('Save failed:', err);
        setSaveStatus('error');
        setServerStatus('error');
        setServerError(err.message);
      }
    }, 400);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [items, sprintBoard, loading]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (viewingItem) setViewingItem(null);
        else if (editingItem) setEditingItem(null);
        else if (showAdd) setShowAdd(false);
        else if (showExport) setShowExport(false);
        else if (showResetConfirm) setShowResetConfirm(false);
        else if (showImportConfirm) setShowImportConfirm(null);
        else if (showBulkMove) setShowBulkMove(false);
        else if (showBulkTier) setShowBulkTier(false);
        else if (showBulkRound) setShowBulkRound(false);
        else if (showAbout) setShowAbout(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewingItem, editingItem, showAdd, showExport, showResetConfirm, showImportConfirm, showBulkMove, showBulkTier, showBulkRound, showAbout]);

  function updateScrollState() {
    const c = scrollContainerRef.current;
    if (!c) return;
    setCanScrollLeft(c.scrollLeft > 2);
    setCanScrollRight(c.scrollLeft < c.scrollWidth - c.clientWidth - 2);
  }

  useEffect(() => {
    if (loading) return;
    updateScrollState();
    const c = scrollContainerRef.current;
    if (!c) return;
    c.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      c.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [loading]);

  function scrollByColumn(direction) {
    const c = scrollContainerRef.current;
    if (!c) return;
    c.scrollBy({ left: direction * 288, behavior: 'smooth' });
  }

  function handleDragMove(e) {
    if (!dragId || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const edgeZone = 100;
    const speed = 12;
    const distFromLeft = e.clientX - rect.left;
    const distFromRight = rect.right - e.clientX;
    if (scrollIntervalRef.current) { clearInterval(scrollIntervalRef.current); scrollIntervalRef.current = null; }
    if (distFromLeft < edgeZone && distFromLeft >= 0) {
      const intensity = 1 - (distFromLeft / edgeZone);
      scrollIntervalRef.current = setInterval(() => { container.scrollLeft -= speed * intensity; }, 16);
    } else if (distFromRight < edgeZone && distFromRight >= 0) {
      const intensity = 1 - (distFromRight / edgeZone);
      scrollIntervalRef.current = setInterval(() => { container.scrollLeft += speed * intensity; }, 16);
    }
  }

  function stopAutoScroll() {
    if (scrollIntervalRef.current) { clearInterval(scrollIntervalRef.current); scrollIntervalRef.current = null; }
  }

  useEffect(() => {
    if (!dragId) stopAutoScroll();
    return () => stopAutoScroll();
  }, [dragId]);

  const filtered = items.filter(item => {
    if (filterColumn !== 'All' && item.column !== filterColumn) return false;
    if (filterReleaseTier !== 'All' && item.releaseTier !== filterReleaseTier) return false;
    if (filterPath && !item.path.toLowerCase().includes(filterPath.toLowerCase())) return false;
    if (filterRound) {
      const r = filterRound.toLowerCase();
      const cand = (item.candidateRound || '').toLowerCase();
      const actual = (item.actualRound || '').toLowerCase();
      if (!cand.includes(r) && !actual.includes(r)) return false;
    }
    if (filterSource !== 'All' && !item.source.toLowerCase().includes(filterSource.toLowerCase())) return false;
    if (filterSeverity !== 'All' && item.severity !== filterSeverity) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!item.title.toLowerCase().includes(s) && !item.description.toLowerCase().includes(s) && !item.notes.toLowerCase().includes(s) && !item.path.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const sources = ['All', ...Array.from(new Set(items.map(i => i.source.split(' ')[0]))).sort()];
  const agentStatus = deriveAgentStatus(items);
  const columnCounts = {};
  COLUMNS.forEach(c => {
    columnCounts[c] = {
      total: items.filter(i => i.column === c).length,
      selected: items.filter(i => i.column === c && selectedIds.includes(i.id)).length,
    };
  });
  const unblockedToDo = items.filter(i => i.column === 'To Do' && !i.reserved).length;
  const labels = { ...DEFAULT_APP_CONFIG.labels, ...(appConfig.labels || {}) };
  const workstreamLabel = labels.workstream || 'Workstream';
  const cycleLabel = labels.cycle || 'Sprint';
  const cycleNoun = cycleLabel.toLowerCase();
  const workstreamName = (item) => `${workstreamLabel} ${item.path}`;

  function toggleSection(column, tier) {
    const key = `${column}:${tier}`;
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function moveItem(itemId, newColumn) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    if (item.reserved && newColumn === 'Doing') {
      alert(`${workstreamName(item)} is RESERVED. Cannot move to Doing without explicit un-flag.`);
      return;
    }
    const updates = { column: newColumn, updatedAt: nowIso() };
    if (item.column !== newColumn) updates.columnEnteredAt = nowIso();
    setItems(items.map(i => i.id === itemId ? { ...i, ...updates } : i));
  }

  function bulkMove(newColumn) {
    const reservedBlock = items.filter(i => selectedIds.includes(i.id) && i.reserved && newColumn === 'Doing');
    if (reservedBlock.length > 0) {
      alert(`${reservedBlock.length} reserved items cannot be moved to Doing.`);
      return;
    }
    setItems(items.map(i => {
      if (!selectedIds.includes(i.id)) return i;
      const updates = { column: newColumn, updatedAt: nowIso() };
      if (i.column !== newColumn) updates.columnEnteredAt = nowIso();
      return { ...i, ...updates };
    }));
    setShowBulkMove(false);
    setSelectedIds([]);
  }

  function bulkSetTier(newTier) {
    setItems(items.map(i => selectedIds.includes(i.id) ? { ...i, releaseTier: newTier, updatedAt: nowIso() } : i));
    setShowBulkTier(false);
    setSelectedIds([]);
  }

  function bulkSetCandidateRound() {
    setItems(items.map(i => selectedIds.includes(i.id) ? { ...i, candidateRound: bulkRoundValue || null, updatedAt: nowIso() } : i));
    setShowBulkRound(false);
    setBulkRoundValue('');
    setSelectedIds([]);
  }

  function bulkDelete() {
    if (!confirm(`Delete ${selectedIds.length} selected items? This cannot be undone.`)) return;
    setItems(items.filter(i => !selectedIds.includes(i.id)));
    setSelectedIds([]);
  }

  function deleteItem(itemId) {
    setItems(items.filter(i => i.id !== itemId));
    setSelectedIds(selectedIds.filter(id => id !== itemId));
    setViewingItem(null);
  }

  function saveItem(itemData) {
    const dataWithTier = { ...itemData, releaseTier: itemData.releaseTier || 'core_release' };
    if (dataWithTier.id) {
      const updated = { ...dataWithTier, updatedAt: nowIso() };
      setItems(items.map(i => i.id === dataWithTier.id ? updated : i));
      if (viewingItem && viewingItem.id === dataWithTier.id) setViewingItem(updated);
    } else {
      const newItem = { ...dataWithTier, id: uid(), createdAt: nowIso(), updatedAt: nowIso(), columnEnteredAt: nowIso() };
      setItems([...items, newItem]);
    }
    setEditingItem(null);
    setShowAdd(false);
  }

  function toggleSelect(id, e) {
    if (e) e.stopPropagation();
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(s => s !== id) : [...selectedIds, id]);
  }
  function clearSelection() { setSelectedIds([]); }
  function resetAll() {
    setItems([]);
    setSprintBoard(DEFAULT_SPRINT_BOARD);
    setShowResetConfirm(false);
    setSelectedIds([]);
  }

  async function createBackup() {
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      if (data.ok) alert(`Backup created: ${data.name}`);
      else alert(`Backup failed: ${data.error}`);
    } catch (err) {
      alert(`Backup error: ${err.message}`);
    }
  }

  function exportJSON() {
    const payload = { items, sprintBoard, exportedAt: nowIso(), version: 'local-v2-tiers' };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_board_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        let importedItems = null;
        let importedSprint = null;
        if (Array.isArray(data)) {
          importedItems = data;
        } else if (data.items && Array.isArray(data.items)) {
          importedItems = data.items;
          if (data.sprintBoard) importedSprint = data.sprintBoard;
        } else {
          alert('Invalid JSON: expected an items array or an export object with { items, sprintBoard }.');
          return;
        }
        if (importedItems.length === 0) {
          alert('Imported file has no items.');
          return;
        }
        // Migrate imported items to ensure releaseTier
        importedItems = importedItems.map(ensureReleaseTier);
        setShowImportConfirm({ items: importedItems, sprintBoard: importedSprint });
      } catch (err) {
        alert(`Failed to parse JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmImport() {
    if (!showImportConfirm) return;
    setItems(showImportConfirm.items);
    if (showImportConfirm.sprintBoard) setSprintBoard({ ...DEFAULT_SPRINT_BOARD, ...showImportConfirm.sprintBoard });
    setShowImportConfirm(null);
    setSelectedIds([]);
  }

  function exportSyncSummary() {
    const groups = {};
    COLUMNS.forEach(c => { groups[c] = items.filter(i => i.column === c); });
    const sevOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentlyDone = groups['Done'].filter(i => new Date(i.updatedAt).getTime() > sevenDaysAgo);

    let md = `**${appConfig.projectName || 'Agent Board'} Sync** - ${new Date().toLocaleString()}\n\n`;
    md += `**Counts:** ${items.length} total - To Do: ${columnCounts['To Do'].total} (${unblockedToDo} unblocked) - Doing: ${columnCounts['Doing'].total} - In Review: ${columnCounts['In Review'].total} - Blocked: ${columnCounts['Blocked'].total} - Done: ${columnCounts['Done'].total}\n\n`;
    md += `**${cycleLabel} board:**\n`;
    md += `- Last ${cycleNoun} (${sprintBoard.lastRoundLabel}): ${sprintBoard.lastRoundSummary}\n`;
    md += `- Current ${cycleNoun} (${sprintBoard.currentRound}): ${sprintBoard.currentRoundGoal}\n`;
    md += `- Next ${cycleNoun} (${sprintBoard.nextRound}): ${sprintBoard.nextRoundGoal}\n\n`;
    md += `**Agent status (auto-derived from Doing column):**\n`;
    md += `- Developer: ${agentStatus.developer ? `${workstreamLabel} ${agentStatus.developer.path} (${agentStatus.developer.actualRound || '-'}) - ${agentStatus.developer.title}` : 'idle'}\n`;
    md += `- AI Agent: ${agentStatus.aiAgent ? `${workstreamLabel} ${agentStatus.aiAgent.path} (${agentStatus.aiAgent.actualRound || '-'}) - ${agentStatus.aiAgent.title}` : 'idle'}\n`;
    md += `- Reviewer: ${agentStatus.reviewer ? `${workstreamLabel} ${agentStatus.reviewer.path} (${agentStatus.reviewer.actualRound || '-'}) - ${agentStatus.reviewer.title}` : 'idle'}\n\n`;
    md += `**DOING (${groups['Doing'].length}):**\n`;
    if (groups['Doing'].length === 0) md += `_(none)_\n`;
    else groups['Doing'].forEach(i => {
      const stale = getStaleInfo(i);
      md += `- ${workstreamLabel} ${i.path} - ${i.title}${i.actualRound ? ` (${i.actualRound})` : ''} [${i.severity}/${i.size}]${stale ? ` ! ${stale.reason}` : ''}\n`;
      if (i.notes) md += `  - ${i.notes}\n`;
    });
    md += `\n**IN REVIEW (${groups['In Review'].length}):**\n`;
    if (groups['In Review'].length === 0) md += `_(none)_\n`;
    else groups['In Review'].forEach(i => {
      md += `- ${workstreamLabel} ${i.path} - ${i.title}${i.actualRound ? ` (${i.actualRound})` : ''}\n`;
      if (i.notes) md += `  - ${i.notes}\n`;
    });
    md += `\n**BLOCKED (${groups['Blocked'].length}):**\n`;
    if (groups['Blocked'].length === 0) md += `_(none)_\n`;
    else groups['Blocked'].forEach(i => {
      md += `- ${workstreamLabel} ${i.path} - ${i.title} [${i.severity}/${i.size}]\n`;
      if (i.notes) md += `  - Blocker: ${i.notes}\n`;
    });
    md += `\n`;
    if (recentlyDone.length > 0) {
      md += `**RECENTLY DONE (last 7 days, ${recentlyDone.length}):**\n`;
      recentlyDone.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).forEach(i => {
        md += `- ${workstreamLabel} ${i.path} - ${i.title}${i.actualRound ? ` (${i.actualRound})` : ''}\n`;
      });
      md += `\n`;
    }
    const topToDo = groups['To Do'].filter(i => !i.reserved && i.releaseTier === 'core_release').sort((a, b) => (sevOrder[a.severity] || 99) - (sevOrder[b.severity] || 99)).slice(0, 5);
    if (topToDo.length > 0) {
      md += `**TOP TO DO (core release, highest severity, top 5):**\n`;
      topToDo.forEach(i => {
        md += `- ${workstreamLabel} ${i.path} - ${i.title} [${i.severity}/${i.size}]${i.candidateRound ? ` (candidate ${cycleNoun}: ${i.candidateRound})` : ''}\n`;
      });
    }
    return md;
  }

  function syncToChat() {
    const summary = exportSyncSummary();
    navigator.clipboard.writeText(summary).then(() => {
      setSyncFlag(true);
      setTimeout(() => setSyncFlag(false), 2000);
    });
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFlag(true);
      setTimeout(() => setCopiedFlag(false), 1500);
    });
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
      <div>Connecting to backend...</div>
      <div className="text-xs text-slate-600">Make sure `npm run dev` is running. Backend at localhost:5174.</div>
    </div>;
  }

  if (serverStatus === 'error' && items.length === 0) {
    return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 p-8 text-slate-400">
      <div className="flex items-center gap-2 text-red-400"><WifiOff size={20} /><span className="font-bold">Cannot reach backend</span></div>
      <div className="text-xs text-slate-500 max-w-md text-center">Backend server should be running at http://localhost:5174. If you ran `npm run dev`, both Vite and the API server should start together. Check the terminal for errors.</div>
      <div className="text-xs text-slate-600 font-mono mt-2">{serverError}</div>
      <button onClick={() => window.location.reload()} className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs">Retry</button>
    </div>;
  }

  const existingPaths = items.map(i => i.path);

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <style>{SCROLLBAR_STYLE}</style>
      <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleImportFileSelect} className="hidden" />
      <div className="p-3 flex flex-col flex-1 min-h-0">
        <header className="mb-2 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-xl font-bold text-blue-300 tracking-wide">{(appConfig.projectName || 'Agent Board').toUpperCase()}</h1>
                <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>{items.length} items - {filtered.length} visible{filtered.length !== items.length && ' (filtered)'}</span>
                  <button onClick={() => setShowAbout(true)} className="text-slate-500 hover:text-blue-400 flex items-center gap-0.5" title="About this tool">
                    <Info size={10} /><span className="text-[9px]">local</span>
                  </button>
                  <span className="flex items-center gap-1">
                    {serverStatus === 'ok' && <><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span><span className="text-[9px] text-green-500">connected</span></>}
                    {serverStatus === 'error' && <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span><span className="text-[9px] text-red-400">disconnected</span></>}
                    {serverStatus === 'connecting' && <><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span><span className="text-[9px] text-yellow-500">connecting</span></>}
                  </span>
                </div>
              </div>
              <div className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                {saveStatus === 'saving' && <><Save size={10} className="text-blue-400 animate-pulse" /><span className="text-blue-400">saving...</span></>}
                {saveStatus === 'saved' && <span className="bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">saved</span>}
                {saveStatus === 'error' && <span className="bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">save failed</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => scrollByColumn(-1)} disabled={!canScrollLeft} className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${canScrollLeft ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}><ChevronLeft size={12} /></button>
              <button onClick={() => scrollByColumn(1)} disabled={!canScrollRight} className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${canScrollRight ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-900 text-slate-600 cursor-not-allowed'}`}><ChevronRight size={12} /></button>
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <button onClick={() => setShowAdd(true)} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs flex items-center gap-1"><Plus size={12} />Add</button>
              <button onClick={() => setShowFilters(!showFilters)} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1">{showFilters ? <ChevronDown size={12} /> : <ChevronRight size={12} />}Filters</button>
              <button onClick={syncToChat} className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-colors ${syncFlag ? 'bg-green-700' : 'bg-emerald-700 hover:bg-emerald-600'}`} title="Copy active-state summary to clipboard for pasting to Chat">
                {syncFlag ? <Check size={12} /> : <MessageSquare size={12} />}
                {syncFlag ? 'Copied' : 'Sync to Chat'}
              </button>
              <button onClick={createBackup} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1" title="Create timestamped backup"><Save size={12} />Backup</button>
              <button onClick={() => setShowExport(true)} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1"><Download size={12} />Export</button>
              <button onClick={() => fileInputRef.current?.click()} className="px-2.5 py-1 bg-amber-800 hover:bg-amber-700 rounded text-xs flex items-center gap-1" title="Import JSON"><Upload size={12} />Import</button>
              <button onClick={() => setShowResetConfirm(true)} className="px-2.5 py-1 bg-slate-800 hover:bg-red-900/50 rounded text-xs flex items-center gap-1"><RotateCcw size={12} />Reset</button>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded mb-2">
            <button onClick={() => setSprintExpanded(!sprintExpanded)} className="w-full px-3 py-1.5 flex items-center justify-between text-xs hover:bg-slate-800/50">
              <div className="flex items-center gap-3 flex-wrap text-left">
                <div className="flex items-center gap-1 text-slate-400 font-semibold"><Target size={11} className="text-blue-400" />{cycleLabel.toUpperCase()} BOARD</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span><span className="text-green-400">{sprintBoard.lastRoundLabel}</span> closed</span>
                  <span className="text-slate-600">-</span>
                  <span><span className="text-blue-400 font-semibold">{sprintBoard.currentRound}</span> in flight</span>
                  <span className="text-slate-600">-</span>
                  <span><span className="text-purple-400">{sprintBoard.nextRound}</span> planning</span>
                  <span className="text-slate-600">-</span>
                  <span className="text-cyan-400">Developer: {agentStatus.developer ? `${workstreamLabel} ${agentStatus.developer.path}` : 'idle'}</span>
                  <span className="text-slate-600">-</span>
                  <span className="text-purple-400">AI Agent: {agentStatus.aiAgent ? `${workstreamLabel} ${agentStatus.aiAgent.path}` : 'idle'}</span>
                  <span className="text-slate-600">-</span>
                  <span className="text-slate-400">Reviewer: {agentStatus.reviewer ? `${workstreamLabel} ${agentStatus.reviewer.path}` : 'idle'}</span>
                </div>
              </div>
              {sprintExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {sprintExpanded && (
              <div className="px-3 pb-3 pt-1 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-1"><Check size={10} className="text-green-400" />Last {cycleNoun}</label>
                      <input type="text" value={sprintBoard.lastRoundLabel} onChange={e => setSprintBoard({ ...sprintBoard, lastRoundLabel: e.target.value })} className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px]" />
                    </div>
                    <textarea value={sprintBoard.lastRoundSummary} onChange={e => setSprintBoard({ ...sprintBoard, lastRoundSummary: e.target.value })} rows={3} placeholder="What shipped?" className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px]" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-1"><Zap size={10} className="text-blue-400" />Current {cycleNoun}</label>
                      <div className="flex items-center gap-1">
                        <input type="text" value={sprintBoard.currentRound} onChange={e => setSprintBoard({ ...sprintBoard, currentRound: e.target.value })} className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px]" />
                        <button onClick={() => setFilterRound(sprintBoard.currentRound)} className="text-[9px] px-1 py-0.5 bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 rounded">Focus</button>
                      </div>
                    </div>
                    <textarea value={sprintBoard.currentRoundGoal} onChange={e => setSprintBoard({ ...sprintBoard, currentRoundGoal: e.target.value })} rows={3} placeholder={`${cycleLabel} goal / scope`} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px]" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-1"><Calendar size={10} className="text-purple-400" />Next {cycleNoun}</label>
                      <div className="flex items-center gap-1">
                        <input type="text" value={sprintBoard.nextRound} onChange={e => setSprintBoard({ ...sprintBoard, nextRound: e.target.value })} className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px]" />
                        <button onClick={() => setFilterRound(sprintBoard.nextRound)} className="text-[9px] px-1 py-0.5 bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 rounded">Focus</button>
                      </div>
                    </div>
                    <textarea value={sprintBoard.nextRoundGoal} onChange={e => setSprintBoard({ ...sprintBoard, nextRoundGoal: e.target.value })} rows={3} placeholder="Planning notes" className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <div className="relative flex-1 max-w-xs">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-7 pr-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs placeholder-slate-500" />
            </div>
            {filterRound && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-900/30 border border-blue-800 rounded text-[10px]">
                <Target size={10} className="text-blue-400" />
                <span className="text-blue-300">Focus: {filterRound}</span>
                <button onClick={() => setFilterRound('')} className="text-blue-400 hover:text-blue-200 ml-1"><X size={10} /></button>
              </div>
            )}
            {filterReleaseTier !== 'All' && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-900/30 border border-purple-800 rounded text-[10px]">
                <Layers size={10} className="text-purple-400" />
                <span className="text-purple-300">Tier: {RELEASE_TIERS.find(t => t.id === filterReleaseTier)?.label}</span>
                <button onClick={() => setFilterReleaseTier('All')} className="text-purple-400 hover:text-purple-200 ml-1"><X size={10} /></button>
              </div>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="bg-purple-900/20 border border-purple-700/50 rounded p-2 mb-2 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-purple-300 font-medium">{selectedIds.length} selected</span>
              <button onClick={() => setShowBulkMove(true)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center gap-1"><ArrowRight size={11} />Move to...</button>
              <button onClick={() => setShowBulkTier(true)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center gap-1"><Layers size={11} />Set tier...</button>
              <button onClick={() => setShowBulkRound(true)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded flex items-center gap-1"><Calendar size={11} />Set candidate {cycleNoun}...</button>
              <button onClick={bulkDelete} className="px-2 py-0.5 bg-slate-800 hover:bg-red-900/50 rounded flex items-center gap-1 text-slate-300 hover:text-red-300"><Trash2 size={11} />Delete</button>
              <div className="flex-1"></div>
              <button onClick={clearSelection} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400">Clear</button>
            </div>
          )}

          {showFilters && (
            <div className="bg-slate-900/50 border border-slate-800 rounded p-2 mb-2 grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px]">
              <div><label className="block text-slate-500 mb-0.5">Column</label>
                <select value={filterColumn} onChange={e => setFilterColumn(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
                  <option>All</option>{COLUMNS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="block text-slate-500 mb-0.5">Release Tier</label>
                <select value={filterReleaseTier} onChange={e => setFilterReleaseTier(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
                  <option value="All">All</option>
                  {RELEASE_TIERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div><label className="block text-slate-500 mb-0.5">{workstreamLabel}</label>
                <input type="text" value={filterPath} onChange={e => setFilterPath(e.target.value)} placeholder="e.g. A" className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5" />
              </div>
              <div><label className="block text-slate-500 mb-0.5">{cycleLabel}</label>
                <input type="text" value={filterRound} onChange={e => setFilterRound(e.target.value)} placeholder="e.g. Sprint 1" className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5" />
              </div>
              <div><label className="block text-slate-500 mb-0.5">Source</label>
                <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
                  {sources.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="block text-slate-500 mb-0.5">Severity</label>
                <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
                  <option>All</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
            </div>
          )}
        </header>

        <div className="relative flex-1 min-h-0 flex flex-col">
          {canScrollLeft && (<button onClick={() => scrollByColumn(-1)} className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-600 flex items-center justify-center shadow-lg"><ChevronLeft size={16} /></button>)}
          {canScrollRight && (<button onClick={() => scrollByColumn(1)} className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-600 flex items-center justify-center shadow-lg"><ChevronRight size={16} /></button>)}

          <div ref={scrollContainerRef} onDragOver={handleDragMove} className="tk-hscroll overflow-x-scroll overflow-y-hidden flex-1 min-h-0 pb-1">
            <div className="flex gap-2 min-w-max h-full">
              {COLUMNS.map(col => {
                const colItems = filtered.filter(i => i.column === col);
                const counts = columnCounts[col];
                return (
                  <div
                    key={col}
                    onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col); }}
                    onDragLeave={() => setDragOverColumn(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragId) moveItem(dragId, col);
                      setDragId(null);
                      setDragOverColumn(null);
                      stopAutoScroll();
                    }}
                    className={`bg-slate-900/40 rounded border-t-2 ${COLUMN_COLORS[col]} ${dragOverColumn === col ? 'ring-2 ring-blue-500' : ''} flex flex-col w-[280px] flex-shrink-0 h-full`}
                  >
                    <div className="px-2.5 py-2 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
                      <h2 className="text-xs font-semibold tracking-wide">{col}</h2>
                      <div className="flex items-center gap-1.5">
                        {counts.selected > 0 && (<span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300">{counts.selected} sel</span>)}
                        <span className="text-[10px] text-slate-500">{counts.total}</span>
                      </div>
                    </div>
                    <div className="tk-vscroll p-1.5 flex-1 overflow-y-auto min-h-0">
                      {colItems.length === 0 && <div className="text-[10px] text-slate-600 italic py-3 text-center">Empty</div>}
                      {colItems.length > 0 && RELEASE_TIERS.map(tier => {
                        const tierItems = colItems.filter(i => i.releaseTier === tier.id);
                        if (tierItems.length === 0) return null;
                        const sectionKey = `${col}:${tier.id}`;
                        const isCollapsed = collapsedSections.has(sectionKey);
                        return (
                          <div key={tier.id} className="mb-2 last:mb-0">
                            <button
                              onClick={() => toggleSection(col, tier.id)}
                              className={`w-full px-1.5 py-1 mb-1 rounded ${tier.bgColor} ${tier.borderColor} border flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider hover:opacity-80`}
                            >
                              <div className="flex items-center gap-1">
                                {isCollapsed ? <ChevronRight size={9} /> : <ChevronDown size={9} />}
                                <span className={tier.color}>{tier.label}</span>
                              </div>
                              <span className={`${tier.color} opacity-70`}>{tierItems.length}</span>
                            </button>
                            {!isCollapsed && (
                              <div className="space-y-1.5">
                                {tierItems.map(item => {
                                  const stale = getStaleInfo(item);
                                  return (
                                    <div
                                      key={item.id}
                                      draggable
                                      onDragStart={(e) => { setDragId(item.id); e.stopPropagation(); }}
                                      onDragEnd={() => { setDragId(null); stopAutoScroll(); }}
                                      onClick={() => setViewingItem(item)}
                                      className={`bg-slate-900 border-l-2 ${sourceAccent(item.source)} border-y border-r ${selectedIds.includes(item.id) ? 'border-purple-500' : 'border-slate-800'} ${item.reserved ? 'ring-1 ring-amber-700/40' : ''} rounded p-2 cursor-pointer hover:border-slate-600 transition-colors`}
                                    >
                                      <div className="flex items-start justify-between gap-1.5 mb-1">
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <span className="text-[9px] font-mono font-bold text-blue-300 bg-blue-900/30 px-1 py-0.5 rounded">{item.path}</span>
                                          {item.reserved && <Lock size={10} className="text-amber-500" />}
                                          <span className={`text-[9px] px-1 py-0.5 rounded ${SEVERITY_COLORS[item.severity]}`}>{item.severity}</span>
                                          <span className="text-[9px] text-slate-500" title={SIZE_LABELS[item.size]}>{item.size}</span>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          {stale && (<span title={stale.reason} className={`inline-flex w-2 h-2 rounded-full ${stale.level === 'critical' ? 'bg-red-500' : 'bg-yellow-500'} animate-pulse`}></span>)}
                                          <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={(e) => toggleSelect(item.id, e)} onClick={(e) => e.stopPropagation()} className="mt-0.5 accent-purple-500 cursor-pointer" />
                                        </div>
                                      </div>
                                      <div className="text-xs font-medium leading-snug mb-1">{item.title}</div>
                                      <div className="text-[10px] text-slate-400 leading-snug mb-1.5 line-clamp-2">{item.description}</div>
                                      <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1 flex-wrap text-[9px] text-slate-500 min-w-0">
                                          <span className="truncate">{item.source}</span>
                                          {item.candidateRound && <span className="text-blue-400 flex-shrink-0">- {item.candidateRound}</span>}
                                          {item.actualRound && <span className="text-green-400 flex-shrink-0">- {item.actualRound}</span>}
                                        </div>
                                        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                          <select value={item.column} onChange={e => moveItem(item.id, e.target.value)} onClick={(e) => e.stopPropagation()} className="bg-slate-800 border border-slate-700 rounded text-[9px] px-0.5 py-0">
                                            {COLUMNS.map(c => <option key={c}>{c}</option>)}
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {dragId && (
            <>
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-blue-500/20 to-transparent opacity-50" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-blue-500/20 to-transparent opacity-50" />
            </>
          )}
        </div>

        <div className="fixed bottom-3 right-3 bg-slate-900/95 border border-slate-700 rounded-lg shadow-lg z-30 backdrop-blur-sm">
          <button onClick={() => setLegendCollapsed(!legendCollapsed)} className="w-full px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200">
            <Palette size={11} /><span>Legend</span>
            {legendCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
          </button>
          {!legendCollapsed && (
            <div className="px-2.5 pb-2 space-y-1 border-t border-slate-800 pt-1.5">
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Release Tiers</div>
              {RELEASE_TIERS.map(t => (
                <div key={t.id} className="flex items-center gap-2 text-[10px]">
                  <span className={`w-3 h-3 rounded-sm ${t.bgColor} ${t.borderColor} border`}></span>
                  <span className={t.color}>{t.label}</span>
                </div>
              ))}
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-2 pt-1.5 border-t border-slate-800">Sources (left border)</div>
              {SOURCE_LEGEND.map(s => (
                <div key={s.label} className="flex items-center gap-2 text-[10px]">
                  <span className={`w-3 h-3 rounded-sm ${s.color}`}></span>
                  <span className="text-slate-300">{s.label}</span>
                  <span className="text-slate-500 ml-auto italic">{s.match}</span>
                </div>
              ))}
              <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-2 pt-1.5 border-t border-slate-800">Stale dots (top-right)</div>
              <div className="flex items-center gap-2 text-[10px]"><span className="w-2 h-2 rounded-full bg-yellow-500"></span><span className="text-slate-300">Warning</span><span className="text-slate-500 ml-auto italic text-[9px]">Doing 7d+, In Rev 5d+</span></div>
              <div className="flex items-center gap-2 text-[10px]"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-slate-300">Critical</span><span className="text-slate-500 ml-auto italic text-[9px]">Doing 14d+, Blocked 14d+</span></div>
              <div className="pt-1 mt-1 border-t border-slate-800 text-[9px] text-slate-500">Reserved items get amber outline.</div>
            </div>
          )}
        </div>

        {viewingItem && <TaskDetailModal item={viewingItem} labels={labels} onClose={() => setViewingItem(null)} onEdit={() => { setEditingItem(viewingItem); setViewingItem(null); }} onDelete={(id) => { if (confirm(`Delete ${workstreamLabel.toLowerCase()} ${viewingItem.path}?`)) deleteItem(id); }} onMove={(id, col) => moveItem(id, col)} />}
        {(editingItem || showAdd) && <ItemEditModal item={editingItem} labels={labels} existingPaths={existingPaths} onSave={saveItem} onClose={() => { setEditingItem(null); setShowAdd(false); }} />}

        {showAbout && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowAbout(false)}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold flex items-center gap-2"><Info size={16} className="text-blue-400" />{appConfig.projectName || 'Agent Board'} (local)</h2>
                <button onClick={() => setShowAbout(false)} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
              </div>
              <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <p><strong>Where data lives:</strong> <code className="text-blue-300">state.json</code>. Auto-saves on every change.</p>
                <p><strong>Release Tiers:</strong> Each item belongs to one of three tiers: <span className="text-blue-300">Core Release</span>, <span className="text-amber-300">Post Release</span>, or <span className="text-purple-300">Future Content</span>. New items default to Core Release.</p>
                <p><strong>Section collapse:</strong> Click any tier header inside a column to collapse/expand that section. Collapsed state persists per session (not saved to disk).</p>
                <p><strong>Filter by tier:</strong> Use the Release Tier filter to focus on just one tier across all columns.</p>
                <p><strong>Backups:</strong> click Backup whenever you want a restore point. Stored in <code className="text-blue-300">backups/</code>.</p>
                <p><strong>Sync to Chat:</strong> click button to copy active-state summary to clipboard. Export JSON when a full state handoff is needed.</p>
                <p className="text-slate-500"><strong>Local project-planning tool only.</strong> Not a hosted service; do not expose it to an untrusted network.</p>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setShowAbout(false)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs">Got it</button>
              </div>
            </div>
          </div>
        )}

        {showBulkMove && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowBulkMove(false)}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3"><h2 className="text-base font-bold">Move {selectedIds.length} items to...</h2><button onClick={() => setShowBulkMove(false)} className="text-slate-400 hover:text-slate-200"><X size={18} /></button></div>
              <div className="space-y-1.5">
                {COLUMNS.map(c => (<button key={c} onClick={() => bulkMove(c)} className={`w-full text-left px-3 py-2 rounded border ${COLUMN_COLORS[c]} bg-slate-800 hover:bg-slate-700 text-sm flex items-center justify-between`}><span>{c}</span><ArrowRight size={14} className="text-slate-500" /></button>))}
              </div>
            </div>
          </div>
        )}

        {showBulkTier && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowBulkTier(false)}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3"><h2 className="text-base font-bold">Set release tier for {selectedIds.length} items</h2><button onClick={() => setShowBulkTier(false)} className="text-slate-400 hover:text-slate-200"><X size={18} /></button></div>
              <div className="space-y-1.5">
                {RELEASE_TIERS.map(t => (<button key={t.id} onClick={() => bulkSetTier(t.id)} className={`w-full text-left px-3 py-2 rounded border ${t.borderColor} ${t.bgColor} hover:opacity-80 text-sm flex items-center justify-between`}><span className={t.color}>{t.label}</span><ArrowRight size={14} className="text-slate-500" /></button>))}
              </div>
            </div>
          </div>
        )}

        {showBulkRound && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowBulkRound(false)}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3"><h2 className="text-base font-bold">Set candidate {cycleNoun} for {selectedIds.length} items</h2><button onClick={() => setShowBulkRound(false)} className="text-slate-400 hover:text-slate-200"><X size={18} /></button></div>
              <input type="text" value={bulkRoundValue} onChange={e => setBulkRoundValue(e.target.value)} placeholder={`e.g. ${sprintBoard.nextRound}`} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm mb-3" autoFocus />
              <div className="flex items-center gap-2 mb-3 text-[10px] text-slate-500">
                Quick set:
                <button onClick={() => setBulkRoundValue(sprintBoard.currentRound)} className="px-1.5 py-0.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 rounded">{sprintBoard.currentRound}</button>
                <button onClick={() => setBulkRoundValue(sprintBoard.nextRound)} className="px-1.5 py-0.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded">{sprintBoard.nextRound}</button>
                <button onClick={() => setBulkRoundValue('')} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded">Clear</button>
              </div>
              <div className="flex justify-end gap-2"><button onClick={() => setShowBulkRound(false)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs">Cancel</button><button onClick={bulkSetCandidateRound} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs">Apply</button></div>
            </div>
          </div>
        )}

        {showImportConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowImportConfirm(null)}>
            <div className="bg-slate-900 border border-amber-700 rounded-lg max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-2 text-amber-400"><AlertTriangle size={18} /><h2 className="text-base font-bold">Replace current data?</h2></div>
              <p className="text-xs text-slate-400 mb-3">Imported file has <strong className="text-slate-200">{showImportConfirm.items.length} items</strong>{showImportConfirm.sprintBoard ? ' and sprint board state' : ''}. This will replace your current backlog ({items.length} items) on disk. Consider creating a Backup first.</p>
              <div className="flex gap-2 justify-end"><button onClick={() => setShowImportConfirm(null)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs">Cancel</button><button onClick={confirmImport} className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 rounded text-xs">Replace with import</button></div>
            </div>
          </div>
        )}

        {showExport && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-slate-800"><h2 className="text-base font-bold flex items-center gap-2"><Download size={16} />Export</h2><button onClick={() => setShowExport(false)} className="text-slate-400 hover:text-slate-200"><X size={18} /></button></div>
              <div className="p-3 overflow-y-auto flex-1 space-y-3">
                <div>
                  <h3 className="text-xs font-semibold mb-1">Sync to Chat (active state)</h3>
                  <p className="text-[10px] text-slate-400 mb-1.5">Focused summary for Chat handoff. Top To Do filtered to Core Release only.</p>
                  <div className="flex items-center gap-2 mb-1.5"><button onClick={() => copyToClipboard(exportSyncSummary())} className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-xs flex items-center gap-1">{copiedFlag ? <Check size={12} /> : <MessageSquare size={12} />}{copiedFlag ? 'Copied' : 'Copy sync summary'}</button></div>
                  <textarea value={exportSyncSummary()} readOnly rows={10} className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold mb-1">Download state.json copy</h3>
                  <p className="text-[10px] text-slate-400 mb-1.5">Drop this into chat to give Chat your full current state.</p>
                  <button onClick={exportJSON} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs flex items-center gap-1"><Download size={12} />Download JSON</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-red-800 rounded-lg max-w-md w-full p-3">
              <div className="flex items-center gap-2 mb-2 text-red-400"><AlertTriangle size={18} /><h2 className="text-base font-bold">Reset to empty?</h2></div>
              <p className="text-xs text-slate-400 mb-3">This wipes all items + sprint board. The state.json on disk is overwritten. Create a Backup first if you want to keep anything.</p>
              <div className="flex gap-2 justify-end"><button onClick={() => setShowResetConfirm(false)} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs">Cancel</button><button onClick={resetAll} className="px-2.5 py-1 bg-red-700 hover:bg-red-600 rounded text-xs">Reset</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskDetailModal({ item, labels = DEFAULT_APP_CONFIG.labels, onClose, onEdit, onDelete, onMove }) {
  const workstreamLabel = labels.workstream || 'Workstream';
  const cycleLabel = labels.cycle || 'Sprint';
  const cycleNoun = cycleLabel.toLowerCase();
  const stale = getStaleInfo(item);
  const tier = RELEASE_TIERS.find(t => t.id === item.releaseTier) || RELEASE_TIERS[0];
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-4 border-b border-slate-800">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-xs font-mono font-bold text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded">{workstreamLabel} {item.path}</span>
              {item.reserved && <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded"><Lock size={10} />RESERVED</span>}
              <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY_COLORS[item.severity]}`}>{item.severity}</span>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{item.size} - {SIZE_LABELS[item.size]}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${tier.bgColor} ${tier.borderColor} border flex items-center gap-1`}><Layers size={10} className={tier.color} /><span className={tier.color}>{tier.label}</span></span>
              {stale && (<span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${stale.level === 'critical' ? 'bg-red-900/40 text-red-300' : 'bg-yellow-900/40 text-yellow-300'}`}><AlertCircle size={10} />{stale.reason}</span>)}
            </div>
            <h2 className="text-lg font-bold leading-tight">{item.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 flex-shrink-0 ml-2"><X size={20} /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm">
          <div><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><FileText size={12} />Description</div><div className="text-slate-200 whitespace-pre-wrap leading-relaxed">{item.description || <span className="italic text-slate-500">(none)</span>}</div></div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><div className="text-slate-500 mb-0.5 flex items-center gap-1"><Tag size={11} />Source</div><div className="text-slate-200">{item.source}</div></div>
            <div><div className="text-slate-500 mb-0.5 flex items-center gap-1"><Tag size={11} />Column</div><select value={item.column} onChange={(e) => onMove(item.id, e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-200">{COLUMNS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><div className="text-slate-500 mb-0.5 flex items-center gap-1"><Calendar size={11} />Candidate {cycleNoun}</div><div className="text-blue-300">{item.candidateRound || <span className="italic text-slate-500">unassigned</span>}</div></div>
            <div><div className="text-slate-500 mb-0.5 flex items-center gap-1"><Calendar size={11} />Actual {cycleNoun}</div><div className="text-green-400">{item.actualRound || <span className="italic text-slate-500">-</span>}</div></div>
          </div>
          <div><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><FileText size={12} />Notes</div><div className="text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-950/50 border border-slate-800 rounded p-2 text-xs">{item.notes || <span className="italic text-slate-500">(none)</span>}</div></div>
          <div className="grid grid-cols-3 gap-3 text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            <div><div className="mb-0.5">Created</div><div className="text-slate-400">{formatDate(item.createdAt)}</div></div>
            <div><div className="mb-0.5">Last updated</div><div className="text-slate-400">{formatDate(item.updatedAt)}</div></div>
            <div><div className="mb-0.5">Entered column</div><div className="text-slate-400">{formatDate(item.columnEnteredAt || item.updatedAt)}</div></div>
          </div>
        </div>
        <div className="p-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <button onClick={() => onDelete(item.id)} className="px-3 py-1.5 bg-slate-800 hover:bg-red-900/50 rounded text-xs flex items-center gap-1.5 text-slate-300 hover:text-red-300"><Trash2 size={12} />Delete</button>
          <div className="flex items-center gap-2"><button onClick={onClose} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs">Close</button><button onClick={onEdit} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs flex items-center gap-1.5"><Edit2 size={12} />Edit</button></div>
        </div>
      </div>
    </div>
  );
}

function ItemEditModal({ item, labels = DEFAULT_APP_CONFIG.labels, existingPaths, onSave, onClose }) {
  const suggestedWorkstream = item ? null : suggestNextPath(existingPaths);
  const workstreamLabel = labels.workstream || 'Workstream';
  const cycleLabel = labels.cycle || 'Sprint';
  const cycleNoun = cycleLabel.toLowerCase();
  const [form, setForm] = useState(item || {
    path: '', title: '', description: '', column: 'To Do', severity: 'Medium', size: 'M',
    source: 'User', candidateRound: '', actualRound: '', reserved: false, notes: '', releaseTier: 'core_release'
  });
  function submit() {
    if (!form.path.trim() || !form.title.trim()) { alert(`${workstreamLabel} and Title are required.`); return; }
    onSave(form);
  }
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-slate-800"><h2 className="text-base font-bold">{item ? `Edit ${workstreamLabel.toLowerCase()} ${item.path}` : 'Add Item'}</h2><button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={18} /></button></div>
        <div className="p-3 overflow-y-auto flex-1 space-y-2 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div><label className="block text-slate-500 mb-0.5">{workstreamLabel} *</label>
              <input type="text" value={form.path} onChange={e => setForm({ ...form, path: e.target.value })} placeholder={suggestedWorkstream ? `e.g. ${suggestedWorkstream}` : 'e.g. A'} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1" />
              {suggestedWorkstream && !form.path && <button onClick={() => setForm({ ...form, path: suggestedWorkstream })} className="text-[10px] text-blue-400 hover:underline mt-0.5">Use suggested: {suggestedWorkstream}</button>}
            </div>
            <div><label className="block text-slate-500 mb-0.5">Severity</label>
              <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1">
                <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div><label className="block text-slate-500 mb-0.5">Size</label>
              <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1">
                <option value="S">S (~60 min)</option><option value="M">M (~120 min)</option><option value="L">L (~180 min)</option><option value="XL">XL (~240+ min)</option>
              </select>
            </div>
          </div>
          <div><label className="block text-slate-500 mb-0.5">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1" />
          </div>
          <div><label className="block text-slate-500 mb-0.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-slate-500 mb-0.5">Column</label>
              <select value={form.column} onChange={e => setForm({ ...form, column: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1">
                {COLUMNS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="block text-slate-500 mb-0.5">Release Tier</label>
              <select value={form.releaseTier || 'core_release'} onChange={e => setForm({ ...form, releaseTier: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1">
                {RELEASE_TIERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-slate-500 mb-0.5">Candidate {cycleNoun}</label>
              <input type="text" value={form.candidateRound || ''} onChange={e => setForm({ ...form, candidateRound: e.target.value })} placeholder={`e.g. ${cycleLabel} 2`} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1" />
            </div>
            <div><label className="block text-slate-500 mb-0.5">Actual {cycleNoun}</label>
              <input type="text" value={form.actualRound || ''} onChange={e => setForm({ ...form, actualRound: e.target.value })} placeholder={`e.g. ${cycleLabel} 2`} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1" />
            </div>
          </div>
          <div><label className="block text-slate-500 mb-0.5">Source</label>
            <input type="text" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="User / AI Agent / Reviewer / Risk" className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1" />
          </div>
          <div><label className="block text-slate-500 mb-0.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1" />
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.reserved} onChange={e => setForm({ ...form, reserved: e.target.checked })} className="accent-amber-500" /><span>Reserved <span className="text-slate-500">(hard-blocks moving to Doing)</span></span></label>
        </div>
        <div className="p-3 border-t border-slate-800 flex justify-end gap-2"><button onClick={onClose} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs">Cancel</button><button onClick={submit} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs">Save</button></div>
      </div>
    </div>
  );
}
