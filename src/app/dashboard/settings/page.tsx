'use client';

import { useState } from 'react';
import { useCategories } from '@/lib/hooks/useCategories';
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown, Archive, ChevronRight, ChevronDown } from 'lucide-react';
import { BudgetHeader, Category } from '@/types/budget';
import { UserManager } from '@/components/settings/UserManager';
import './settings.css';

export default function SettingsPage() {
  const {
    headers,
    categories,
    loading,
    addHeader,
    updateHeader,
    deleteHeader,
    reorderHeaders,
    addCategory,
    updateCategory,
    archiveCategory,
    reorderCategories
  } = useCategories();

  const VAULT_COLORS = [
    { name: 'Blue', var: 'var(--vault-blue)', soft: 'var(--vault-blue-soft)' },
    { name: 'Emerald', var: 'var(--vault-emerald)', soft: 'var(--vault-emerald-soft)' },
    { name: 'Amethyst', var: 'var(--vault-amethyst)', soft: 'var(--vault-amethyst-soft)' },
    { name: 'Rose', var: 'var(--vault-rose)', soft: 'var(--vault-rose-soft)' },
    { name: 'Amber', var: 'var(--vault-amber)', soft: 'var(--vault-amber-soft)' },
    { name: 'Teal', var: 'var(--vault-teal)', soft: 'var(--vault-teal-soft)' },
  ];

  const [newHeaderName, setNewHeaderName] = useState('');
  const [newHeaderType, setNewHeaderType] = useState<'income' | 'expense'>('expense');
  const [newHeaderColor, setNewHeaderColor] = useState(VAULT_COLORS[0].var);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [newCategoryHeaderId, setNewCategoryHeaderId] = useState('');

  const [editingHeader, setEditingHeader] = useState<string | null>(null);
  const [editHeaderName, setEditHeaderName] = useState('');
  const [editHeaderType, setEditHeaderType] = useState<'income' | 'expense'>('expense');
  const [editHeaderColor, setEditHeaderColor] = useState('');

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryType, setEditCategoryType] = useState<'income' | 'expense'>('expense');
  const [editCategoryHeaderId, setEditCategoryHeaderId] = useState('');

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (headerId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [headerId]: !prev[headerId]
    }));
  };

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  // --- Header Actions ---
  const handleAddHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeaderName.trim()) return;
    await addHeader(newHeaderName, newHeaderType, newHeaderColor);
    setNewHeaderName('');
  };

  const handleUpdateHeader = async (id: string) => {
    if (!editHeaderName.trim()) return;
    await updateHeader(id, { name: editHeaderName, type: editHeaderType, color: editHeaderColor });
    setEditingHeader(null);
  };

  const moveHeader = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === headers.length - 1) return;

    const newHeaders = [...headers];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newHeaders[index];
    newHeaders[index] = newHeaders[swapIndex];
    newHeaders[swapIndex] = temp;

    await reorderHeaders(newHeaders);
  };

  // --- Category Actions ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !newCategoryHeaderId) return;
    
    // Auto-sync category type with the parent header
    const parentHeader = headers.find(h => h.id === newCategoryHeaderId);
    const resolvedType = parentHeader ? parentHeader.type : 'expense';

    await addCategory(newCategoryHeaderId, newCategoryName, resolvedType);
    setNewCategoryName('');
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editCategoryName.trim() || !editCategoryHeaderId) return;
    
    // Auto-sync category type with the new header's type
    const parentHeader = headers.find(h => h.id === editCategoryHeaderId);
    const updatedType = parentHeader ? parentHeader.type : editCategoryType;

    await updateCategory(id, { 
      name: editCategoryName, 
      headerId: editCategoryHeaderId,
      type: updatedType 
    });
    setEditingCategory(null);
  };

  const moveCategory = async (headerId: string, id: string, direction: 'up' | 'down') => {
    const parentCategories = categories.filter(c => c.headerId === headerId).sort((a,b) => a.order - b.order);
    const index = parentCategories.findIndex(c => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === parentCategories.length - 1) return;

    const newCategories = [...parentCategories];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newCategories[index];
    newCategories[index] = newCategories[swapIndex];
    newCategories[swapIndex] = temp;

    // reorder uses the absolute category order, but reorderCategories updates just those in the array map to their new index order among themselves.
    // So we just need to pass the swapped local list and it handles index as order.
    await reorderCategories(newCategories);
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Budget Settings</h1>
        <p>Manage your budget categories and headers here.</p>
      </header>

      <div className="settings-sections">
        {/* CATEGORIES MANAGEMENT */}
        <section className="settings-card">
          <h2>Categories</h2>
          
          <form className="add-form" onSubmit={handleAddCategory}>
            <input 
              type="text" 
              placeholder="New category name..." 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
            />
            <select value={newCategoryHeaderId} onChange={(e) => setNewCategoryHeaderId(e.target.value)} required>
              <option value="" disabled>Select Header</option>
              {headers.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary" disabled={headers.length === 0}><Plus size={16} /> Add Category</button>
          </form>

          {headers.map(header => {
            const headerCats = categories.filter(c => c.headerId === header.id);
            const isExpanded = !!expandedGroups[header.id];
            
            return (
              <div key={`cat-group-${header.id}`} className="category-group">
                <button 
                  className="category-group-toggle" 
                  onClick={() => toggleGroup(header.id)}
                  aria-expanded={isExpanded}
                >
                  <h3 className="category-group-title">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {header.name}
                    <span className="count-badge">{headerCats.length}</span>
                  </h3>
                </button>

                {isExpanded && (
                  <ul className="settings-list category-list">
                    {headerCats.length === 0 ? (
                      <p className="text-gray-500 italic p-4 text-sm">No categories in this header.</p>
                    ) : (
                      headerCats.map((cat, index) => (
                        <li key={cat.id} className="settings-list-item">
                          <div className="item-content">
                            <div className="order-controls">
                              <button onClick={() => moveCategory(header.id, cat.id, 'up')} disabled={index === 0}><ArrowUp size={14}/></button>
                              <button onClick={() => moveCategory(header.id, cat.id, 'down')} disabled={index === headerCats.length - 1}><ArrowDown size={14}/></button>
                            </div>
                            
                            {editingCategory === cat.id ? (
                              <div className="edit-mode stack">
                                <input 
                                  type="text" 
                                  value={editCategoryName} 
                                  onChange={(e) => setEditCategoryName(e.target.value)} 
                                  autoFocus
                                />
                                <select value={editCategoryHeaderId} onChange={(e) => setEditCategoryHeaderId(e.target.value)}>
                                  {headers.map(h => (
                                    <option key={`edit-cat-h-${h.id}`} value={h.id}>{h.name} ({h.type})</option>
                                  ))}
                                </select>
                                <div className="edit-actions">
                                  <button onClick={() => handleUpdateCategory(cat.id)} className="btn btn-sm btn-success">Save</button>
                                  <button onClick={() => setEditingCategory(null)} className="btn btn-sm btn-ghost">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="view-mode pl-2">
                                <span>{cat.name}</span>
                              </div>
                            )}
                          </div>

                          <div className="item-actions">
                            <button onClick={() => { 
                              setEditingCategory(cat.id); 
                              setEditCategoryName(cat.name);
                              setEditCategoryHeaderId(cat.headerId);
                              setEditCategoryType(cat.type);
                            }} className="btn-icon">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => { if(confirm('Archive category? It will be hidden but kept for historical records.')) archiveCategory(cat.id); }} className="btn-icon text-warning">
                              <Archive size={16} />
                            </button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </section>

        {/* HEADERS MANAGEMENT */}
        <section className="settings-card">
          <h2>Budget Headers</h2>
          
          <form className="add-form stack" onSubmit={handleAddHeader}>
            <div className="form-row">
              <input 
                type="text" 
                placeholder="New header name..." 
                value={newHeaderName}
                onChange={(e) => setNewHeaderName(e.target.value)}
                required
              />
              <select value={newHeaderType} onChange={(e) => setNewHeaderType(e.target.value as any)}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            
            <div className="color-picker">
              <span className="text-xs text-muted mr-2">Color:</span>
              {VAULT_COLORS.map(color => (
                <div 
                  key={`new-color-${color.var}`}
                  className={`color-swatch ${newHeaderColor === color.var ? 'active' : ''}`}
                  style={{ backgroundColor: color.var }}
                  onClick={() => setNewHeaderColor(color.var)}
                  title={color.name}
                />
              ))}
            </div>
            <button type="submit" className="btn btn-primary"><Plus size={16} /> Add Header</button>
          </form>

          <ul className="settings-list">
            {headers.map((header, index) => (
              <li key={header.id} className="settings-list-item">
                <div className="item-content">
                  <div className="order-controls">
                    <button onClick={() => moveHeader(index, 'up')} disabled={index === 0}><ArrowUp size={14}/></button>
                    <button onClick={() => moveHeader(index, 'down')} disabled={index === headers.length - 1}><ArrowDown size={14}/></button>
                  </div>
                  
                  {editingHeader === header.id ? (
                    <div className="edit-mode stack">
                      <input 
                        type="text" 
                        value={editHeaderName} 
                        onChange={(e) => setEditHeaderName(e.target.value)} 
                        autoFocus
                      />
                      <select value={editHeaderType} onChange={(e) => setEditHeaderType(e.target.value as any)}>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                      
                      <div className="color-picker">
                        {VAULT_COLORS.map(color => (
                          <div 
                            key={`edit-color-${color.var}`}
                            className={`color-swatch ${editHeaderColor === color.var ? 'active' : ''}`}
                            style={{ backgroundColor: color.var }}
                            onClick={() => setEditHeaderColor(color.var)}
                          />
                        ))}
                      </div>

                      <div className="edit-actions">
                        <button onClick={() => handleUpdateHeader(header.id)} className="btn btn-sm btn-success">Save</button>
                        <button onClick={() => setEditingHeader(null)} className="btn btn-sm btn-ghost">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="view-mode">
                      <div className="color-indicator" style={{ backgroundColor: header.color || 'var(--color-primary)' }}></div>
                      <span className="font-semibold">{header.name}</span>
                      <span className="badge badge-outline text-xs uppercase ml-2">{header.type}</span>
                    </div>
                  )}
                </div>

                <div className="item-actions">
                  <button onClick={() => { 
                    setEditingHeader(header.id); 
                    setEditHeaderName(header.name);
                    setEditHeaderType(header.type);
                    setEditHeaderColor(header.color || VAULT_COLORS[0].var);
                  }} className="btn-icon">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => { if(confirm('Delete header? Ensure no categories rely on it.')) deleteHeader(header.id); }} className="btn-icon text-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
            {headers.length === 0 && <p className="text-gray-500 italic p-4 text-center">No headers found. Create one above.</p>}
          </ul>
        </section>

        {/* USER MANAGEMENT */}
        <UserManager />
      </div>
    </div>
  );
}
