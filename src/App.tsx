import { useState, useEffect, useMemo } from 'react'
import {
  Home,
  FolderOpen,
  MessageSquare,
  FileText,
  Search,
  Plus,
  Pencil,
  Trash2,
  Star,
  Copy,
  Download,
  Check,
  X,
  Clock,
  Layers,
  Upload,
} from 'lucide-react'

const STORAGE_KEY = 'context_manager_v1'

interface Project {
  id: string
  name: string
  stack: string
  tags: string[]
  rules: string
  notes: string
  createdAt: string
  updatedAt: string
}

interface Prompt {
  id: string
  title: string
  content: string
  category: string
  projectId: string | null
  tags: string[]
  isTemplate: boolean
  favorite: boolean
  createdAt: string
  updatedAt: string
}

interface AgentsFile {
  id: string
  title: string
  projectId: string | null
  answers: Record<string, any>
  markdown: string
  history: { markdown: string; savedAt: string }[]
  createdAt: string
  updatedAt: string
}

interface State {
  projects: Project[]
  prompts: Prompt[]
  agentsFiles: AgentsFile[]
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function nowISO() {
  return new Date().toISOString()
}

function fmtDate(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
}

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { projects: [], prompts: [], agentsFiles: [] }
}

export default function App() {
  const [state, setState] = useState<State>(loadState)
  const [view, setView] = useState<string>('dashboard')
  const [searchProjects, setSearchProjects] = useState('')
  const [searchPrompts, setSearchPrompts] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterFav, setFilterFav] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const recentItems = useMemo(() => {
    const items = [
      ...state.projects.map((p) => ({ ...p, _type: 'project' as const, _label: p.name })),
      ...state.prompts.map((p) => ({ ...p, _type: 'prompt' as const, _label: p.title })),
      ...state.agentsFiles.map((a) => ({ ...a, _type: 'agents' as const, _label: a.title })),
    ]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 6)
    return items
  }, [state])

  const filteredProjects = useMemo(() => {
    const q = searchProjects.toLowerCase()
    return state.projects
      .filter((p) => !q || [p.name, p.stack, p.tags.join(' '), p.rules, p.notes].join(' ').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
  }, [state.projects, searchProjects])

  const filteredPrompts = useMemo(() => {
    const q = searchPrompts.toLowerCase()
    return state.prompts
      .filter((p) => {
        if (filterCategory && p.category !== filterCategory) return false
        if (filterFav && !p.favorite) return false
        if (!q) return true
        return [p.title, p.content, p.tags.join(' '), p.category].join(' ').toLowerCase().includes(q)
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
  }, [state.prompts, searchPrompts, filterCategory, filterFav])

  const searchResults = useMemo(() => {
    const q = globalSearch.toLowerCase()
    if (!q) return null
    return {
      projects: state.projects.filter((p) => [p.name, p.stack, p.tags.join(' '), p.notes, p.rules].join(' ').toLowerCase().includes(q)),
      prompts: state.prompts.filter((p) => [p.title, p.content, p.tags.join(' '), p.category].join(' ').toLowerCase().includes(q)),
      agents: state.agentsFiles.filter((a) => [a.title, a.markdown].join(' ').toLowerCase().includes(q)),
    }
  }, [globalSearch, state])

  function projectName(id: string | null) {
    if (!id) return null
    const p = state.projects.find((p) => p.id === id)
    return p ? p.name : null
  }

  function updateState(updater: (prev: State) => State) {
    setState(updater)
  }

  return (
    <div className="app">
      <Topbar onExport={() => downloadText('context-manager-backup.json', JSON.stringify(state, null, 2))} />
      <NavTabs view={view} onNavigate={setView} />
      <main className="main">
        {view === 'dashboard' && (
          <Dashboard
            state={state}
            recentItems={recentItems}
            onNavigate={(type, id) => {
              setView(type === 'project' ? 'projects' : type === 'prompt' ? 'prompts' : 'agents')
            }}
          />
        )}
        {view === 'projects' && (
          <Projects
            projects={filteredProjects}
            search={searchProjects}
            onSearchChange={setSearchProjects}
            onUpdate={(updater) =>
              updateState((prev) => ({ ...prev, projects: updater(prev.projects) }))
            }
          />
        )}
        {view === 'prompts' && (
          <Prompts
            prompts={filteredPrompts}
            projects={state.projects}
            search={searchPrompts}
            onSearchChange={setSearchPrompts}
            filterCategory={filterCategory}
            onFilterCategoryChange={setFilterCategory}
            filterFav={filterFav}
            onFilterFavChange={setFilterFav}
            projectName={projectName}
            onUpdate={(updater) =>
              updateState((prev) => ({ ...prev, prompts: updater(prev.prompts) }))
            }
          />
        )}
        {view === 'agents' && (
          <Agents
            agentsFiles={state.agentsFiles}
            projects={state.projects}
            projectName={projectName}
            onUpdate={(updater) =>
              updateState((prev) => ({ ...prev, agentsFiles: updater(prev.agentsFiles) }))
            }
          />
        )}
        {view === 'search' && (
          <SearchView
            query={globalSearch}
            onQueryChange={setGlobalSearch}
            results={searchResults}
            onNavigate={(type, id) => {
              setView(type === 'project' ? 'projects' : type === 'prompt' ? 'prompts' : 'agents')
            }}
          />
        )}
      </main>
    </div>
  )
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function Topbar({ onExport }: { onExport: () => void }) {
  return (
    <header className="topbar">
      <button className="brand" type="button">
        <div className="brand-mark">CM</div>
        <span>Context</span>
      </button>
      <div className="top-actions">
        <button onClick={onExport}>
          <Download size={16} />
          <span>Exportar</span>
        </button>
        <button>
          <Upload size={16} />
          <span>Importar</span>
        </button>
      </div>
      <div className="topbar-spacer" />
      <div className="save-state">
        <Check size={15} />
        <span>Salvo local</span>
      </div>
    </header>
  )
}

function NavTabs({ view, onNavigate }: { view: string; onNavigate: (v: string) => void }) {
  const items = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'projects', icon: FolderOpen, label: 'Projetos' },
    { id: 'prompts', icon: MessageSquare, label: 'Prompts' },
    { id: 'agents', icon: FileText, label: 'AGENTS.md' },
    { id: 'search', icon: Search, label: 'Busca' },
  ]

  return (
    <nav className="nav-tabs">
      {items.map((item) => (
        <button
          key={item.id}
          className={`nav-tab ${view === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <item.icon size={15} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function Dashboard({
  state,
  recentItems,
  onNavigate,
}: {
  state: State
  recentItems: any[]
  onNavigate: (type: string, id: string) => void
}) {
  const favCount = state.prompts.filter((p) => p.favorite).length

  return (
    <section className="view active">
      <div className="view-header">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1 className="page-title">Dashboard</h1>
        </div>
      </div>
      <div className="stat-grid">
        <StatCard num={state.projects.length} label="Projetos" />
        <StatCard num={state.prompts.length} label="Prompts" />
        <StatCard num={state.agentsFiles.length} label="AGENTS.md" />
        <StatCard num={favCount} label="Favoritos" />
      </div>
      <h4 className="section-label">Atualizados recentemente</h4>
      <div className="grid">
        {recentItems.length === 0 ? (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            <Layers size={32} />
            <div>Nada por aqui ainda. Crie um projeto, prompt ou AGENTS.md.</div>
          </div>
        ) : (
          recentItems.map((it) => (
            <div
              key={it.id}
              className="card item-card"
              style={{ cursor: 'pointer' }}
              onClick={() => onNavigate(it._type, it.id)}
            >
              <div className="item-top">
                <p className="item-title">{it._label}</p>
                <span className="badge">
                  {it._type === 'project' ? 'Projeto' : it._type === 'prompt' ? 'Prompt' : 'AGENTS.md'}
                </span>
              </div>
              <div className="item-meta">Atualizado em {fmtDate(it.updatedAt || it.createdAt)}</div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function StatCard({ num, label }: { num: number; label: string }) {
  return (
    <div className="card stat-card">
      <div className="stat-num">{num}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function Projects({
  projects,
  search,
  onSearchChange,
  onUpdate,
}: {
  projects: Project[]
  search: string
  onSearchChange: (s: string) => void
  onUpdate: (updater: (prev: Project[]) => Project[]) => void
}) {
  const [editing, setEditing] = useState<Project | null>(null)
  const [showModal, setShowModal] = useState(false)

  function handleDelete(id: string) {
    if (confirm('Excluir este projeto?')) {
      onUpdate((prev) => prev.filter((p) => p.id !== id))
    }
  }

  function handleSave(data: Partial<Project>) {
    if (editing) {
      onUpdate((prev) =>
        prev.map((p) => (p.id === editing.id ? { ...p, ...data, updatedAt: nowISO() } : p))
      )
    } else {
      onUpdate((prev) => [...prev, { id: uid(), createdAt: nowISO(), updatedAt: nowISO(), name: '', stack: '', tags: [], rules: '', notes: '', ...data } as Project])
    }
    setShowModal(false)
    setEditing(null)
  }

  return (
    <section className="view active">
      <div className="view-header">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1 className="page-title">Projetos</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null)
            setShowModal(true)
          }}
        >
          <Plus size={16} /> Novo projeto
        </button>
      </div>
      <div className="toolbar">
        <div className="grow">
          <input
            type="search"
            placeholder="Buscar por nome, stack ou tag..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="grid">
        {projects.length === 0 ? (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            <FolderOpen size={32} />
            <div>Nenhum projeto ainda.</div>
          </div>
        ) : (
          projects.map((p) => (
            <div key={p.id} className="card item-card">
              <div className="item-top">
                <p className="item-title">{p.name}</p>
                <div className="item-actions">
                  <button
                    className="btn btn-icon btn-ghost"
                    onClick={() => {
                      setEditing(p)
                      setShowModal(true)
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-icon btn-danger" onClick={() => handleDelete(p.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {p.stack && <span className="badge">{p.stack}</span>}
              {p.notes && <div className="item-text">{p.notes}</div>}
              <div className="chip-row">
                {p.tags.map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
              <div className="item-meta">Atualizado em {fmtDate(p.updatedAt || p.createdAt)}</div>
            </div>
          ))
        )}
      </div>
      {showModal && (
        <ProjectModal
          project={editing}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}

function ProjectModal({
  project,
  onSave,
  onClose,
}: {
  project: Project | null
  onSave: (data: Partial<Project>) => void
  onClose: () => void
}) {
  const [name, setName] = useState(project?.name || '')
  const [stack, setStack] = useState(project?.stack || '')
  const [tags, setTags] = useState(project?.tags.join(', ') || '')
  const [rules, setRules] = useState(project?.rules || '')
  const [notes, setNotes] = useState(project?.notes || '')

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>{project ? 'Editar projeto' : 'Novo projeto'}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="field">
          <label>Nome do projeto / cliente</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: GDR Consultoria" />
        </div>
        <div className="field">
          <label>Stack</label>
          <input type="text" value={stack} onChange={(e) => setStack(e.target.value)} placeholder="Ex: Next.js, TypeScript" />
        </div>
        <div className="field">
          <label>Tags (separadas por vírgula)</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="marketing, ativo" />
        </div>
        <div className="field">
          <label>Regras específicas</label>
          <textarea value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Ex: sem any, sempre testes" />
        </div>
        <div className="field">
          <label>Notas rápidas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações gerais" />
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!name.trim()) return
              onSave({
                name: name.trim(),
                stack: stack.trim(),
                tags: tags
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
                rules: rules.trim(),
                notes: notes.trim(),
              })
            }}
          >
            <Check size={14} /> Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function Prompts({
  prompts,
  projects,
  search,
  onSearchChange,
  filterCategory,
  onFilterCategoryChange,
  filterFav,
  onFilterFavChange,
  projectName,
  onUpdate,
}: {
  prompts: Prompt[]
  projects: Project[]
  search: string
  onSearchChange: (s: string) => void
  filterCategory: string
  onFilterCategoryChange: (s: string) => void
  filterFav: boolean
  onFilterFavChange: (b: boolean) => void
  projectName: (id: string | null) => string | null
  onUpdate: (updater: (prev: Prompt[]) => Prompt[]) => void
}) {
  const [editing, setEditing] = useState<Prompt | null>(null)
  const [showModal, setShowModal] = useState(false)

  function handleDelete(id: string) {
    if (confirm('Excluir este prompt?')) {
      onUpdate((prev) => prev.filter((p) => p.id !== id))
    }
  }

  function handleToggleFav(id: string) {
    onUpdate((prev) =>
      prev.map((p) => (p.id === id ? { ...p, favorite: !p.favorite, updatedAt: nowISO() } : p))
    )
  }

  function handleCopy(content: string) {
    navigator.clipboard.writeText(content)
  }

  function handleSave(data: Partial<Prompt>) {
    if (editing) {
      onUpdate((prev) =>
        prev.map((p) => (p.id === editing.id ? { ...p, ...data, updatedAt: nowISO() } : p))
      )
    } else {
      onUpdate((prev) => [
        ...prev,
        { id: uid(), favorite: false, createdAt: nowISO(), updatedAt: nowISO(), title: '', content: '', category: 'Outros', projectId: null, tags: [], isTemplate: false, ...data } as Prompt,
      ])
    }
    setShowModal(false)
    setEditing(null)
  }

  return (
    <section className="view active">
      <div className="view-header">
        <div>
          <p className="eyebrow">Biblioteca</p>
          <h1 className="page-title">Prompts</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null)
            setShowModal(true)
          }}
        >
          <Plus size={16} /> Novo prompt
        </button>
      </div>
      <div className="toolbar">
        <div className="grow">
          <input
            type="search"
            placeholder="Buscar por título, conteúdo ou tag..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          style={{ width: 160 }}
          value={filterCategory}
          onChange={(e) => onFilterCategoryChange(e.target.value)}
        >
          <option value="">Todas categorias</option>
          <option>Copy</option>
          <option>Código</option>
          <option>Design</option>
          <option>Marketing</option>
          <option>Outros</option>
        </select>
        <label className="checkline" style={{ whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={filterFav} onChange={(e) => onFilterFavChange(e.target.checked)} />
          Só favoritos
        </label>
      </div>
      <div className="grid">
        {prompts.length === 0 ? (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            <MessageSquare size={32} />
            <div>Nenhum prompt encontrado.</div>
          </div>
        ) : (
          prompts.map((p) => (
            <div key={p.id} className="card item-card">
              <div className="item-top">
                <p className="item-title">{p.title}</p>
                <div className="item-actions">
                  <button className={`star-btn ${p.favorite ? 'active' : ''}`} onClick={() => handleToggleFav(p.id)}>
                    <Star size={18} />
                  </button>
                </div>
              </div>
              <div className="chip-row">
                <span className="badge">{p.category || 'Outros'}</span>
                {p.isTemplate && <span className="badge badge-template">Template</span>}
                {p.projectId && projectName(p.projectId) && (
                  <span className="badge">{projectName(p.projectId)}</span>
                )}
              </div>
              <div className="item-text">{p.content}</div>
              <div className="chip-row">
                {p.tags.map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
              <div className="item-top" style={{ marginTop: 4 }}>
                <div className="item-meta">Atualizado em {fmtDate(p.updatedAt || p.createdAt)}</div>
                <div className="item-actions">
                  <button className="btn btn-icon btn-ghost" onClick={() => handleCopy(p.content)}>
                    <Copy size={14} />
                  </button>
                  <button
                    className="btn btn-icon btn-ghost"
                    onClick={() => {
                      setEditing(p)
                      setShowModal(true)
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-icon btn-danger" onClick={() => handleDelete(p.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {showModal && (
        <PromptModal
          prompt={editing}
          projects={projects}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}

function PromptModal({
  prompt,
  projects,
  onSave,
  onClose,
}: {
  prompt: Prompt | null
  projects: Project[]
  onSave: (data: Partial<Prompt>) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(prompt?.title || '')
  const [content, setContent] = useState(prompt?.content || '')
  const [category, setCategory] = useState(prompt?.category || 'Outros')
  const [projectId, setProjectId] = useState(prompt?.projectId || '')
  const [tags, setTags] = useState(prompt?.tags.join(', ') || '')
  const [isTemplate, setIsTemplate] = useState(prompt?.isTemplate || false)

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>{prompt ? 'Editar prompt' : 'Novo prompt'}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="field">
          <label>Título</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Headline AIDA" />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Copy</option>
              <option>Código</option>
              <option>Design</option>
              <option>Marketing</option>
              <option>Outros</option>
            </select>
          </div>
          <div className="field">
            <label>Projeto vinculado</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Nenhum</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Conteúdo</label>
          <textarea
            style={{ minHeight: 140 }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva o prompt..."
          />
        </div>
        <div className="field">
          <label>Tags (separadas por vírgula)</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="copy, instagram" />
        </div>
        <label className="checkline">
          <input type="checkbox" checked={isTemplate} onChange={(e) => setIsTemplate(e.target.checked)} />
          Este é um template
        </label>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!title.trim() || !content.trim()) return
              onSave({
                title: title.trim(),
                content: content.trim(),
                category,
                projectId: projectId || null,
                tags: tags
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
                isTemplate,
              })
            }}
          >
            <Check size={14} /> Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function Agents({
  agentsFiles,
  projects,
  projectName,
  onUpdate,
}: {
  agentsFiles: AgentsFile[]
  projects: Project[]
  projectName: (id: string | null) => string | null
  onUpdate: (updater: (prev: AgentsFile[]) => AgentsFile[]) => void
}) {
  const [editing, setEditing] = useState<AgentsFile | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  function handleDelete(id: string) {
    if (confirm('Excluir este AGENTS.md?')) {
      onUpdate((prev) => prev.filter((a) => a.id !== id))
    }
  }

  function handleSave(data: Partial<AgentsFile>) {
    if (editing) {
      onUpdate((prev) =>
        prev.map((a) => (a.id === editing.id ? { ...a, ...data, updatedAt: nowISO() } : a))
      )
    } else {
      onUpdate((prev) => [
        ...prev,
        { id: uid(), title: '', projectId: null, answers: {}, markdown: '', history: [], createdAt: nowISO(), updatedAt: nowISO(), ...data } as AgentsFile,
      ])
    }
    setShowEditor(false)
    setEditing(null)
  }

  return (
    <section className="view active">
      {!showEditor ? (
        <>
          <div className="view-header">
            <div>
              <p className="eyebrow">Para IA de código</p>
              <h1 className="page-title">AGENTS.md</h1>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditing(null)
                setShowEditor(true)
              }}
            >
              <Plus size={16} /> Novo AGENTS.md
            </button>
          </div>
          <div className="grid">
            {agentsFiles.length === 0 ? (
              <div className="empty" style={{ gridColumn: '1/-1' }}>
                <FileText size={32} />
                <div>Nenhum AGENTS.md criado ainda.</div>
              </div>
            ) : (
              agentsFiles.map((a) => (
                <div key={a.id} className="card item-card">
                  <div className="item-top">
                    <p className="item-title">{a.title}</p>
                    <div className="item-actions">
                      <button className="btn btn-icon btn-ghost" onClick={() => downloadText('AGENTS.md', a.markdown)}>
                        <Download size={14} />
                      </button>
                      <button className="btn btn-icon btn-danger" onClick={() => handleDelete(a.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {a.projectId && projectName(a.projectId) ? (
                    <span className="badge">{projectName(a.projectId)}</span>
                  ) : (
                    <span className="badge">Sem projeto</span>
                  )}
                  <div className="item-meta">
                    Versões: {(a.history || []).length} · Atualizado em {fmtDate(a.updatedAt || a.createdAt)}
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: 6 }}
                    onClick={() => {
                      setEditing(a)
                      setShowEditor(true)
                    }}
                  >
                    Abrir editor
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <AgentsEditor
          agentsFile={editing}
          projects={projects}
          projectName={projectName}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false)
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}

function AgentsEditor({
  agentsFile,
  projects,
  projectName,
  onSave,
  onClose,
}: {
  agentsFile: AgentsFile | null
  projects: Project[]
  projectName: (id: string | null) => string | null
  onSave: (data: Partial<AgentsFile>) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(agentsFile?.title || '')
  const [projectId, setProjectId] = useState(agentsFile?.projectId || '')
  const [description, setDescription] = useState(agentsFile?.answers?.projectDescription || '')
  const [stack, setStack] = useState(agentsFile?.answers?.stack || 'TypeScript')
  const [framework, setFramework] = useState(agentsFile?.answers?.framework || '')
  const [codeStyle, setCodeStyle] = useState(agentsFile?.answers?.codeStyle || 'camelCase')
  const [tests, setTests] = useState(agentsFile?.answers?.tests || 'Opcional')
  const [folderStructure, setFolderStructure] = useState(agentsFile?.answers?.folderStructure || 'Feature-based')
  const [linter, setLinter] = useState(agentsFile?.answers?.linter || 'ESLint + Prettier')
  const [commitStyle, setCommitStyle] = useState(agentsFile?.answers?.commitStyle || 'Conventional Commits')
  const [errorHandling, setErrorHandling] = useState(agentsFile?.answers?.errorHandling || 'try/catch')
  const [commentLevel, setCommentLevel] = useState(agentsFile?.answers?.commentLevel || 'Mínimo')
  const [prohibitions, setProhibitions] = useState<string[]>(agentsFile?.answers?.prohibitions || [])

  const markdown = useMemo(() => {
    const codeExamples: Record<string, string> = {
      camelCase: '// certo\nfunction calcularTotal() {}',
      snake_case: '# certo\ndef calcular_total(): pass',
      PascalCase: '// certo\nclass PedidoService {}',
      'kebab-case': '// certo\nimport "./pedido-service"',
    }
    return `# AGENTS.md
${title || 'AGENTS.md'}

## Contexto do projeto
${projectName(projectId) ? `Projeto: ${projectName(projectId)}\n` : ''}${description || 'Sem descrição.'}

## Stack
- Linguagem: ${stack}
- Framework: ${framework || 'Não definido'}

## Convenções
- Nomenclatura: ${codeStyle}
- Linter: ${linter}
- Comentários: ${commentLevel}

## Estrutura
${folderStructure}

## Testes
${tests}

## Commits
${commitStyle}

## Erros
${errorHandling}

## Proibições
${prohibitions.length ? prohibitions.map((p) => `- ${p}`).join('\n') : '- Nenhuma'}

## Exemplo
\`\`\`
${codeExamples[codeStyle] || ''}
\`\`\`
`
  }, [title, projectId, description, stack, framework, codeStyle, tests, folderStructure, linter, commitStyle, errorHandling, commentLevel, prohibitions])

  function toggleProhibition(value: string) {
    setProhibitions((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]))
  }

  return (
    <>
      <div className="view-header">
        <div>
          <p className="eyebrow">Editor</p>
          <h1 className="page-title" style={{ fontSize: 24 }}>
            {agentsFile ? 'Editar AGENTS.md' : 'Novo AGENTS.md'}
          </h1>
        </div>
        <button className="btn btn-secondary" onClick={onClose}>
          <X size={16} /> Voltar
        </button>
      </div>
      <div className="editor-grid">
        <div>
          <div className="field">
            <label>Título</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: AGENTS.md - Projeto" />
          </div>
          <div className="field">
            <label>Projeto vinculado</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Nenhum</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Contexto do projeto</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o projeto..." />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Stack</label>
              <select value={stack} onChange={(e) => setStack(e.target.value)}>
                <option>JavaScript</option>
                <option>TypeScript</option>
                <option>Python</option>
                <option>Go</option>
                <option>PHP</option>
              </select>
            </div>
            <div className="field">
              <label>Framework</label>
              <input type="text" value={framework} onChange={(e) => setFramework(e.target.value)} placeholder="Ex: Next.js" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Nomenclatura</label>
              <select value={codeStyle} onChange={(e) => setCodeStyle(e.target.value)}>
                <option>camelCase</option>
                <option>snake_case</option>
                <option>PascalCase</option>
                <option>kebab-case</option>
              </select>
            </div>
            <div className="field">
              <label>Testes</label>
              <select value={tests} onChange={(e) => setTests(e.target.value)}>
                <option>Obrigatório</option>
                <option>Opcional</option>
                <option>Nenhum</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Proibições</label>
            {['Sem any', 'Sem console.log', 'Sem var', 'Sem comentário óbvio'].map((opt) => (
              <label key={opt} className="checkline">
                <input type="checkbox" checked={prohibitions.includes(opt)} onChange={() => toggleProhibition(opt)} />
                {opt}
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="preview-pane">
            <div className="preview-head">
              <span className="preview-dot" />
              <span className="preview-filename">AGENTS.md</span>
            </div>
            <div className="preview-body">{markdown}</div>
            <div className="preview-foot">
              <button
                className="btn btn-primary"
                onClick={() =>
                  onSave({
                    title: title || 'AGENTS.md',
                    projectId: projectId || null,
                    answers: { projectDescription: description, stack, framework, codeStyle, tests, folderStructure, linter, commitStyle, errorHandling, commentLevel, prohibitions },
                    markdown,
                  })
                }
              >
                <Check size={14} /> Salvar
              </button>
              <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(markdown)}>
                <Copy size={14} /> Copiar
              </button>
              <button className="btn btn-secondary" onClick={() => downloadText('AGENTS.md', markdown)}>
                <Download size={14} /> Baixar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function SearchView({
  query,
  onQueryChange,
  results,
  onNavigate,
}: {
  query: string
  onQueryChange: (s: string) => void
  results: { projects: Project[]; prompts: Prompt[]; agents: AgentsFile[] } | null
  onNavigate: (type: string, id: string) => void
}) {
  return (
    <section className="view active">
      <div className="view-header">
        <div>
          <p className="eyebrow">Tudo num lugar</p>
          <h1 className="page-title">Busca</h1>
        </div>
      </div>
      <div className="search-input-wrap">
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          type="search"
          placeholder="Buscar projetos, prompts e AGENTS.md..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          style={{ paddingLeft: 42 }}
        />
      </div>
      {results && (
        <>
          {results.projects.length > 0 && (
            <div className="search-group">
              <h4>Projetos ({results.projects.length})</h4>
              <div className="grid">
                {results.projects.map((p) => (
                  <div key={p.id} className="card item-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('project', p.id)}>
                    <p className="item-title">{p.name}</p>
                    <div className="item-meta">{p.stack}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.prompts.length > 0 && (
            <div className="search-group">
              <h4>Prompts ({results.prompts.length})</h4>
              <div className="grid">
                {results.prompts.map((p) => (
                  <div key={p.id} className="card item-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('prompt', p.id)}>
                    <p className="item-title">{p.title}</p>
                    <div className="item-text">{p.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.agents.length > 0 && (
            <div className="search-group">
              <h4>AGENTS.md ({results.agents.length})</h4>
              <div className="grid">
                {results.agents.map((a) => (
                  <div key={a.id} className="card item-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('agents', a.id)}>
                    <p className="item-title">{a.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.projects.length === 0 && results.prompts.length === 0 && results.agents.length === 0 && (
            <div className="empty">
              <Search size={32} />
              <div>Nada encontrado para "{query}".</div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
