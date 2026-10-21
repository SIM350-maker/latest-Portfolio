"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CMSLayout } from "@/components/CMSLayout";
import {
  ArrowLeft,
  Save,
  Download,
  Eye,
  Copy,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  FileText,
  Type,
  Image as ImageIcon,
  Settings,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Bold,
  Italic,
  List,
  Undo,
  Redo,
} from "lucide-react";
import Link from "next/link";

interface GeneratedDocument {
  id: number;
  application_id: number;
  template_id: number | null;
  type: 'CV' | 'COVER_LETTER' | 'EMAIL' | 'OTHER';
  title: string;
  content_json: CVContent;
  html_content: string | null;
  version: number;
  status: string;
  provenance_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CVContent {
  contact?: { name?: string; email?: string; phone?: string; location?: string; linkedin?: string; github?: string; portfolio?: string };
  headline?: string;
  summary?: string;
  sections: Array<{
    id: string;
    type: 'skills' | 'experience' | 'education' | 'projects' | 'certifications' | 'custom';
    title: string;
    visible: boolean;
    order: number;
    entries: Array<{
      id: string;
      title: string;
      subtitle?: string;
      meta?: string;
      date?: string;
      bullets: string[];
      evidenceRefs?: Array<{ table: string; id: number }>;
    }>;
  }>;
}

const DEFAULT_CV_CONTENT: CVContent = {
  contact: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
  headline: '',
  summary: '',
  sections: [
    { id: 'skills', type: 'skills', title: 'Technical Skills', visible: true, order: 1, entries: [] },
    { id: 'experience', type: 'experience', title: 'Professional Experience', visible: true, order: 2, entries: [] },
    { id: 'education', type: 'education', title: 'Education', visible: true, order: 3, entries: [] },
    { id: 'projects', type: 'projects', title: 'Projects', visible: true, order: 4, entries: [] },
    { id: 'certifications', type: 'certifications', title: 'Certifications', visible: true, order: 5, entries: [] },
  ],
};

const SECTION_TYPES = [
  { value: 'skills', label: 'Skills', icon: Type },
  { value: 'experience', label: 'Experience', icon: FileText },
  { value: 'education', label: 'Education', icon: ImageIcon },
  { value: 'projects', label: 'Projects', icon: FileText },
  { value: 'certifications', label: 'Certifications', icon: ImageIcon },
  { value: 'custom', label: 'Custom Section', icon: Settings },
] as const;

export default function DocumentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [content, setContent] = useState<CVContent>(DEFAULT_CV_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'versions'>('edit');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1, 2]));

  useEffect(() => {
    fetchDocument();
  }, [params]);

  const fetchDocument = async () => {
    const { id } = await params;
    try {
      setLoading(true);
      const res = await fetch(`/api/career/documents/${id}`);
      if (!res.ok) throw new Error('Failed to load document');
      const data = await res.json();
      setDocument(data.document);
      if (data.document?.content_json) {
        setContent(data.document.content_json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (createVersion = false) => {
    if (!document) return;
    setSaving(true);
    setError(null);
    try {
      const url = `/api/career/documents/${document.id}${createVersion ? '?action=new_version' : ''}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, action: createVersion ? 'new_version' : undefined }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setDocument(data.document);
      setContent(data.document.content_json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'doc' | 'txt') => {
    if (!document) return;
    try {
      const res = await fetch(`/api/career/documents/${document.id}?format=${format}`);
      if (!res.ok) throw new Error(`Failed to export ${format.toUpperCase()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.title.replace(/[^a-z0-9]/gi, '_')}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to export ${format.toUpperCase()}`);
    }
  };

  const handleContentChange = (updater: (prev: CVContent) => CVContent) => {
    setContent(prev => {
      const next = updater(prev);
      // Auto-save to localStorage for recovery
      localStorage.setItem(`cv_draft_${document?.id}`, JSON.stringify(next));
      return next;
    });
  };

  // Section management
  const addSection = () => {
    handleContentChange(prev => ({
      ...prev,
      sections: [...prev.sections, {
        id: `section_${Date.now()}`,
        type: 'custom',
        title: 'New Section',
        visible: true,
        order: prev.sections.length + 1,
        entries: [],
      }],
    }));
  };

  const removeSection = (index: number) => {
    handleContentChange(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    handleContentChange(prev => {
      const sections = [...prev.sections];
      const [removed] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, removed);
      return { ...prev, sections: sections.map((s, i) => ({ ...s, order: i + 1 })) };
    });
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Entry management
  const addEntry = (sectionIndex: number) => {
    handleContentChange(prev => {
      const sections = [...prev.sections];
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        entries: [...sections[sectionIndex].entries, {
          id: `entry_${Date.now()}`,
          title: '',
          subtitle: '',
          meta: '',
          date: '',
          bullets: [''],
        }],
      };
      return { ...prev, sections };
    });
  };

  const removeEntry = (sectionIndex: number, entryIndex: number) => {
    handleContentChange(prev => {
      const sections = [...prev.sections];
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        entries: sections[sectionIndex].entries.filter((_, i) => i !== entryIndex),
      };
      return { ...prev, sections };
    });
  };

  const updateEntry = (sectionIndex: number, entryIndex: number, field: string, value: string) => {
    handleContentChange(prev => {
      const sections = [...prev.sections];
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        entries: sections[sectionIndex].entries.map((e, i) =>
          i === entryIndex ? { ...e, [field]: value } : e
        ),
      };
      return { ...prev, sections };
    });
  };

  const updateBullet = (sectionIndex: number, entryIndex: number, bulletIndex: number, value: string) => {
    handleContentChange(prev => {
      const sections = [...prev.sections];
      const bullets = [...sections[sectionIndex].entries[entryIndex].bullets];
      bullets[bulletIndex] = value;
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        entries: sections[sectionIndex].entries.map((e, i) =>
          i === entryIndex ? { ...e, bullets } : e
        ),
      };
      return { ...prev, sections };
    });
  };

  const addBullet = (sectionIndex: number, entryIndex: number) => {
    handleContentChange(prev => {
      const sections = [...prev.sections];
      const bullets = [...sections[sectionIndex].entries[entryIndex].bullets, ''];
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        entries: sections[sectionIndex].entries.map((e, i) =>
          i === entryIndex ? { ...e, bullets } : e
        ),
      };
      return { ...prev, sections };
    });
  };

  const removeBullet = (sectionIndex: number, entryIndex: number, bulletIndex: number) => {
    handleContentChange(prev => {
      const sections = [...prev.sections];
      const bullets = sections[sectionIndex].entries[entryIndex].bullets.filter((_, i) => i !== bulletIndex);
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        entries: sections[sectionIndex].entries.map((e, i) =>
          i === entryIndex ? { ...e, bullets: bullets.length ? bullets : [''] } : e
        ),
      };
      return { ...prev, sections };
    });
  };

  if (loading) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </CMSLayout>
    );
  }

  if (error && !document) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center h-64 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold">Unable to Load Document</h2>
          <p className="text-sm text-on-surface-variant">{error}</p>
        </div>
      </CMSLayout>
    );
  }

  const DocTypeIcon = document?.type === 'CV' ? FileText : document?.type === 'COVER_LETTER' ? ImageIcon : ImageIcon;

  return (
    <CMSLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/manage/career/applications/${document?.application_id}`} className="p-2 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
<div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
                  <DocTypeIcon className="w-5 h-5 text-primary" />
                  {document?.title || 'Untitled Document'}
                </h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                  document?.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                  document?.status === 'REVIEWED' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                  'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}>
                  {document?.status}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                Version {document?.version} · {document?.type} · Updated {new Date(document?.updated_at || '').toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => handleExport('pdf')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-surface-container-low text-xs font-mono text-on-surface hover:bg-surface-container transition-colors">
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button onClick={() => handleExport('doc')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-surface-container-low text-xs font-mono text-on-surface hover:bg-surface-container transition-colors">
              <FileText className="w-3.5 h-3.5" />
              <span>Word</span>
            </button>
            <button onClick={() => handleExport('txt')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-surface-container-low text-xs font-mono text-on-surface hover:bg-surface-container transition-colors">
              <Type className="w-3.5 h-3.5" />
              <span>TXT</span>
            </button>
            <button onClick={() => handleSave(false)} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving…' : 'Save'}</span>
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-border bg-surface-container-low text-sm font-mono text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50">
              <Plus className="w-3.5 h-3.5" />
              <span>New Version</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-1" role="tablist">
            {[
              { id: 'edit', label: 'Editor', icon: Edit3 },
              { id: 'preview', label: 'Preview', icon: Eye },
              { id: 'versions', label: 'Versions', icon: FileText },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'edit' && (
          <EditorTab
            content={content}
            onChange={handleContentChange}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            onAddSection={addSection}
            onRemoveSection={removeSection}
            onMoveSection={moveSection}
            onAddEntry={addEntry}
            onRemoveEntry={removeEntry}
            onUpdateEntry={updateEntry}
            onUpdateBullet={updateBullet}
            onAddBullet={addBullet}
            onRemoveBullet={removeBullet}
          />
        )}

        {activeTab === 'preview' && (
          <PreviewTab content={content} />
        )}

        {activeTab === 'versions' && (
          <VersionsTab document={document} />
        )}
      </div>
    </CMSLayout>
  );
}

function EditorTab({
  content,
  onChange,
  expandedSections,
  onToggleSection,
  onAddSection,
  onRemoveSection,
  onMoveSection,
  onAddEntry,
  onRemoveEntry,
  onUpdateEntry,
  onUpdateBullet,
  onAddBullet,
  onRemoveBullet,
}: {
  content: CVContent;
  onChange: (updater: (prev: CVContent) => CVContent) => void;
  expandedSections: Set<number>;
  onToggleSection: (index: number) => void;
  onAddSection: () => void;
  onRemoveSection: (index: number) => void;
  onMoveSection: (from: number, to: number) => void;
  onAddEntry: (sectionIndex: number) => void;
  onRemoveEntry: (sectionIndex: number, entryIndex: number) => void;
  onUpdateEntry: (sectionIndex: number, entryIndex: number, field: string, value: string) => void;
  onUpdateBullet: (sectionIndex: number, entryIndex: number, bulletIndex: number, value: string) => void;
  onAddBullet: (sectionIndex: number, entryIndex: number) => void;
  onRemoveBullet: (sectionIndex: number, entryIndex: number, bulletIndex: number) => void;
}) {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Contact & Header Fields */}
      <div className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-on-surface uppercase tracking-wide font-mono flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Document Header
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <EditorField label="Full Name" value={content.contact?.name || ''} onChange={v => onChange(p => ({ ...p, contact: { ...p.contact, name: v } }))} placeholder="John Doe" />
          <EditorField label="Email" value={content.contact?.email || ''} onChange={v => onChange(p => ({ ...p, contact: { ...p.contact, email: v } }))} placeholder="john@example.com" type="email" />
          <EditorField label="Phone" value={content.contact?.phone || ''} onChange={v => onChange(p => ({ ...p, contact: { ...p.contact, phone: v } }))} placeholder="+1 555 123 4567" />
          <EditorField label="Location" value={content.contact?.location || ''} onChange={v => onChange(p => ({ ...p, contact: { ...p.contact, location: v } }))} placeholder="City, Country" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <EditorField label="LinkedIn" value={content.contact?.linkedin || ''} onChange={v => onChange(p => ({ ...p, contact: { ...p.contact, linkedin: v } }))} placeholder="linkedin.com/in/..." />
          <EditorField label="GitHub" value={content.contact?.github || ''} onChange={v => onChange(p => ({ ...p, contact: { ...p.contact, github: v } }))} placeholder="github.com/..." />
          <EditorField label="Portfolio" value={content.contact?.portfolio || ''} onChange={v => onChange(p => ({ ...p, contact: { ...p.contact, portfolio: v } }))} placeholder="example.com" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EditorField label="Professional Headline" value={content.headline || ''} onChange={v => onChange(p => ({ ...p, headline: v }))} placeholder="Senior Software Engineer | Full Stack | Cloud Native" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-on-surface block">Professional Summary</label>
          <textarea
            value={content.summary || ''}
            onChange={e => onChange(p => ({ ...p, summary: e.target.value }))}
            rows={4}
            placeholder="Write a compelling summary of your experience, skills, and career objectives..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {content.sections.map((section, sectionIndex) => (
          <SectionEditor
            key={section.id}
            section={section}
            sectionIndex={sectionIndex}
            isExpanded={expandedSections.has(sectionIndex)}
            onToggle={() => onToggleSection(sectionIndex)}
            onRemove={() => onRemoveSection(sectionIndex)}
            onMoveUp={() => sectionIndex > 0 && onMoveSection(sectionIndex, sectionIndex - 1)}
            onMoveDown={() => sectionIndex < content.sections.length - 1 && onMoveSection(sectionIndex, sectionIndex + 1)}
            onAddEntry={() => onAddEntry(sectionIndex)}
            onUpdateEntry={(entryIndex, field, value) => onUpdateEntry(sectionIndex, entryIndex, field, value)}
            onRemoveEntry={(entryIndex) => onRemoveEntry(sectionIndex, entryIndex)}
            onUpdateBullet={(entryIndex, bulletIndex, value) => onUpdateBullet(sectionIndex, entryIndex, bulletIndex, value)}
            onAddBullet={(entryIndex) => onAddBullet(sectionIndex, entryIndex)}
            onRemoveBullet={(entryIndex, bulletIndex) => onRemoveBullet(sectionIndex, entryIndex, bulletIndex)}
          />
        ))}

        {/* Add Section Button */}
        <button onClick={onAddSection} className="w-full py-3 border-2 border-dashed border-border rounded-xl text-on-surface-variant hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="font-mono text-sm">Add Section</span>
        </button>
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  sectionIndex,
  isExpanded,
  onToggle,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddEntry,
  onUpdateEntry,
  onRemoveEntry,
  onUpdateBullet,
  onAddBullet,
  onRemoveBullet,
}: {
  section: CVContent['sections'][0];
  sectionIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddEntry: () => void;
  onUpdateEntry: (entryIndex: number, field: string, value: string) => void;
  onRemoveEntry: (entryIndex: number) => void;
  onUpdateBullet: (entryIndex: number, bulletIndex: number, value: string) => void;
  onAddBullet: (entryIndex: number) => void;
  onRemoveBullet: (entryIndex: number, bulletIndex: number) => void;
}) {
  const typeInfo = SECTION_TYPES.find(t => t.value === section.type) || SECTION_TYPES[5];

  return (
    <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors"
      >
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-on-surface-variant cursor-grab" />
          <typeInfo.icon className="w-5 h-5 text-primary" />
          <input
            type="text"
            value={section.title}
            onChange={e => onUpdateEntry(-1, 'sectionTitle', e.target.value)}
            className="bg-transparent border-none text-on-surface font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-48"
          />
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
            section.visible ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-600 border border-gray-500/20'
          }`}>
            {section.visible ? 'Visible' : 'Hidden'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onMoveUp && <button onClick={onMoveUp} className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container" title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>}
          {onMoveDown && <button onClick={onMoveDown} className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container" title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>}
          <label className="flex items-center gap-1.5 text-xs font-mono text-on-surface-variant cursor-pointer">
            <input type="checkbox" checked={section.visible} onChange={e => onUpdateEntry(-1, 'visible', e.target.checked ? 'true' : 'false')} className="w-3.5 h-3.5" />
            <span>Visible</span>
          </label>
          <button onClick={onRemove} className="p-1.5 rounded text-red-500 hover:bg-red-500/10" title="Remove section"><Trash2 className="w-3.5 h-3.5" /></button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-on-surface-variant" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant" />}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Section Type Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-on-surface-variant">Type:</span>
            <select
              value={section.type}
              onChange={e => onUpdateEntry(-1, 'sectionType', e.target.value)}
              className="px-3 py-1.5 rounded border border-border bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Entries */}
          {section.entries.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">
              <p className="text-sm mb-3">No entries yet</p>
              <button onClick={onAddEntry} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Entry</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {section.entries.map((entry, entryIndex) => (
                <EntryEditor
                  key={entry.id}
                  entry={entry}
                  entryIndex={entryIndex}
                  onUpdate={(field, value) => onUpdateEntry(entryIndex, field, value)}
                  onRemove={() => onRemoveEntry(entryIndex)}
                  onUpdateBullet={(bulletIndex, value) => onUpdateBullet(entryIndex, bulletIndex, value)}
                  onAddBullet={() => onAddBullet(entryIndex)}
                  onRemoveBullet={(bulletIndex) => onRemoveBullet(entryIndex, bulletIndex)}
                />
              ))}
              <button onClick={onAddEntry} className="w-full py-2 border border-dashed border-border rounded-lg text-on-surface-variant hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="font-mono text-sm">Add Another Entry</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EntryEditor({
  entry,
  entryIndex,
  onUpdate,
  onRemove,
  onUpdateBullet,
  onAddBullet,
  onRemoveBullet,
}: {
  entry: CVContent['sections'][0]['entries'][0];
  entryIndex: number;
  onUpdate: (field: string, value: string) => void;
  onRemove: () => void;
  onUpdateBullet: (bulletIndex: number, value: string) => void;
  onAddBullet: () => void;
  onRemoveBullet: (bulletIndex: number) => void;
}) {
  return (
    <div className="bg-surface-container-low border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <EditorField
              label="Title"
              value={entry.title}
              onChange={v => onUpdate('title', v)}
              placeholder="Job Title, Degree, Project Name..."
            />
            <EditorField
              label="Subtitle"
              value={entry.subtitle || ''}
              onChange={v => onUpdate('subtitle', v)}
              placeholder="Company, Institution, Tech Stack..."
            />
            <EditorField
              label="Meta"
              value={entry.meta || ''}
              onChange={v => onUpdate('meta', v)}
              placeholder="Location, Grade, Type..."
            />
            <EditorField
              label="Date"
              value={entry.date || ''}
              onChange={v => onUpdate('date', v)}
              placeholder="2022-2024, Jan 2023 - Present..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono text-on-surface-variant block">Bullet Points</label>
            <div className="space-y-1.5">
              {entry.bullets.map((bullet, bulletIndex) => (
                <div key={bulletIndex} className="flex items-start gap-2">
                  <span className="text-on-surface-variant text-sm mt-1">•</span>
                  <input
                    type="text"
                    value={bullet}
                    onChange={e => onUpdateBullet(bulletIndex, e.target.value)}
                    className="flex-1 px-3 py-2 rounded border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Achievement, responsibility, technology used..."
                  />
                  {entry.bullets.length > 1 && (
                    <button onClick={() => onRemoveBullet(bulletIndex)} className="p-1.5 rounded text-red-500 hover:bg-red-500/10" title="Remove bullet">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={onAddBullet} className="text-sm text-primary hover:underline flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bullet</span>
              </button>
            </div>
          </div>
        </div>
        <button onClick={onRemove} className="p-1.5 rounded text-red-500 hover:bg-red-500/10 shrink-0" title="Remove entry">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EditorField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-mono text-on-surface-variant block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
      />
    </div>
  );
}

function PreviewTab({ content }: { content: CVContent }) {
  // Simple preview - in production would render with proper styling
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 max-h-[70vh] overflow-auto">
        <div className="space-y-6">
          {content.contact && (
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{content.contact.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                {content.contact.email && <span>{content.contact.email}</span>}
                {content.contact.phone && <span>{content.contact.phone}</span>}
                {content.contact.location && <span>{content.contact.location}</span>}
                {content.contact.linkedin && <span>{content.contact.linkedin}</span>}
                {content.contact.github && <span>{content.contact.github}</span>}
                {content.contact.portfolio && <span>{content.contact.portfolio}</span>}
              </div>
            </div>
          )}
          {content.headline && <h2 className="text-lg text-gray-600 dark:text-gray-300 font-medium">{content.headline}</h2>}
          {content.summary && <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{content.summary}</p>}
          {content.sections.filter(s => s.visible).sort((a, b) => a.order - b.order).map(section => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-1">{section.title}</h3>
              {section.entries.map(entry => (
                <div key={entry.id} className="space-y-1">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">{entry.title}</span>
                    {entry.subtitle && <span className="text-gray-600 dark:text-gray-400">{entry.subtitle}</span>}
                    {entry.meta && <span className="text-gray-500 dark:text-gray-500">{entry.meta}</span>}
                    {entry.date && <span className="text-gray-500 dark:text-gray-500 font-mono">{entry.date}</span>}
                  </div>
                  {entry.bullets.filter(b => b.trim()).map((bullet, i) => (
                    <p key={i} className="text-sm text-gray-700 dark:text-gray-300 ml-4 flex items-start gap-1">
                      <span>•</span>
                      <span>{bullet}</span>
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VersionsTab({ document }: { document: GeneratedDocument | null }) {
  if (!document) return null;
  return (
    <div className="p-4 sm:p-6">
      <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-sm text-on-surface uppercase tracking-wide font-mono">Document Versions</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-on-surface">Version {document.version} (Current)</div>
                <div className="text-xs text-on-surface-variant font-mono">{document.status} · Updated {new Date(document.updated_at).toLocaleString()}</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary">Active</span>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant">Previous versions would be listed here.</p>
        </div>
      </div>
    </div>
  );
}