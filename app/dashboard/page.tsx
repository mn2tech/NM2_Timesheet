'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays } from 'date-fns';
import { LogOut, Plus, Edit2, Trash2, Clock, Save, Calendar } from 'lucide-react';
import NM2TechLogo from '@/components/NM2TechLogo';
import HelpChatbot from '@/components/HelpChatbot';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project: string;
  description: string;
}

interface TableRow {
  date: string;
  hours: string;
  project: string;
  description: string;
  entryId?: string; // If this row has an existing entry
}

interface Project {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    project: '',
    description: '',
  });
  
  // Excel-like table state
  const [payPeriodStart, setPayPeriodStart] = useState(() => {
    // Default to current week (Monday to Sunday)
    const today = new Date();
    return format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  });
  const [payPeriodEnd, setPayPeriodEnd] = useState(() => {
    const today = new Date();
    return format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  });
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [bulkProject, setBulkProject] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  // Generate table rows for the pay period
  const generateTableRows = () => {
    if (!payPeriodStart || !payPeriodEnd) return;
    
    const start = parseISO(payPeriodStart);
    const end = parseISO(payPeriodEnd);
    const days = eachDayOfInterval({ start, end });
    
    const rows: TableRow[] = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const existingEntry = entries.find(e => e.date === dateStr);
      
      // Default to empty (Select Project) if no existing entry
      return {
        date: dateStr,
        hours: existingEntry ? existingEntry.hours.toString() : '',
        project: existingEntry ? existingEntry.project : '',
        description: existingEntry ? existingEntry.description : '',
        entryId: existingEntry?.id,
      };
    });
    
    setTableRows(rows);
  };

  // Generate table rows when pay period or entries change
  useEffect(() => {
    if (payPeriodStart && payPeriodEnd && projects.length > 0) {
      generateTableRows();
    }
  }, [payPeriodStart, payPeriodEnd, entries, projects]);

  const loadData = async () => {
    try {
      // API routes - Next.js will handle basePath automatically
      const [userRes, entriesRes, projectsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/time-entries'),
        fetch('/api/projects'),
      ]);

      if (userRes.status === 401) {
        router.push('/login');
        return;
      }

      const userData = await userRes.json();
      
      // Redirect admins to admin dashboard
      if (userData.user?.role === 'admin') {
        router.push('/admin');
        return;
      }

      const entriesData = await entriesRes.json();
      const projectsData = await projectsRes.json();

      setUser(userData.user);
      setEntries(entriesData.entries || []);
      setProjects(projectsData.projects || []);
      
      // Debug: Log projects to see what's being loaded
      console.log('Loaded projects:', projectsData.projects);
      
      // Don't set default project - let user select
      // setFormData will keep empty project field
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };


  // Update a specific cell in the table
  const updateTableCell = (index: number, field: 'hours' | 'project' | 'description', value: string) => {
    const newRows = [...tableRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setTableRows(newRows);
  };

  // Save all entries in the table
  const handleBulkSave = async () => {
    setSaving(true);
    try {
      const entriesToSave = tableRows
        .filter(row => {
          const hours = parseFloat(row.hours);
          return row.hours && !isNaN(hours) && hours > 0;
        })
        .map(row => {
          const hours = parseFloat(row.hours);
          const project = row.project?.trim();
          
          if (!project) {
            throw new Error(`Project is required for date ${format(parseISO(row.date), 'MMM dd, yyyy')}`);
          }
          
          return {
            date: row.date,
            hours: hours,
            project: project,
            description: (row.description || '').trim(),
            entryId: row.entryId,
          };
        });

      if (entriesToSave.length === 0) {
        alert('No entries to save. Please enter hours for at least one day.');
        setSaving(false);
        return;
      }

      // Save each entry (create or update) with better error handling
      const results = await Promise.allSettled(
        entriesToSave.map(async (entry) => {
          const url = entry.entryId 
            ? `/api/time-entries/${entry.entryId}`
            : '/api/time-entries';
          
          const method = entry.entryId ? 'PUT' : 'POST';
          
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: entry.date,
              hours: entry.hours,
              project: entry.project,
              description: entry.description,
            }),
          });

          if (!res.ok) {
            let errorMessage = 'Failed to save entry';
            try {
              const errorData = await res.json();
              errorMessage = errorData.error || errorMessage;
            } catch {
              errorMessage = `Server error: ${res.status} ${res.statusText}`;
            }
            throw new Error(`${errorMessage} (${format(parseISO(entry.date), 'MMM dd, yyyy')})`);
          }
          
          return entry;
        })
      );

      // Check for failures
      const failures = results.filter(r => r.status === 'rejected');
      const successes = results.filter(r => r.status === 'fulfilled');

      if (failures.length > 0) {
        const errorMessages = failures.map(f => 
          f.status === 'rejected' ? f.reason?.message || 'Unknown error' : ''
        ).join('\n');
        alert(`Some entries failed to save:\n\n${errorMessages}\n\n${successes.length} entries saved successfully.`);
      } else {
        alert(`Successfully saved ${successes.length} time entries!`);
      }
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error saving entries:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save entries'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // API routes - Next.js will handle basePath automatically
      const url = editingEntry 
        ? `/api/time-entries/${editingEntry.id}`
        : '/api/time-entries';
      
      const method = editingEntry ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to save entry');
        return;
      }

      setShowForm(false);
      setEditingEntry(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        hours: '',
        project: '',
        description: '',
      });
      loadData();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      hours: entry.hours.toString(),
      project: entry.project,
      description: entry.description,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const res = await fetch(`/api/time-entries/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        alert('Failed to delete entry');
        return;
      }

      loadData();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <NM2TechLogo size="sm" />
              <p className="text-xs text-gray-500 mt-1">Timesheet Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Time Entries</h2>
              <p className="text-gray-600 mt-1">
                Total hours: <span className="font-semibold">{totalHours.toFixed(2)}</span>
              </p>
            </div>
            <button
              onClick={handleBulkSave}
              disabled={saving}
              className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save All Entries'}</span>
            </button>
          </div>
          
          {/* Pay Period Selector */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center space-x-4">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pay Period Start
                  </label>
                  <input
                    type="date"
                    value={payPeriodStart}
                    onChange={(e) => setPayPeriodStart(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pay Period End
                  </label>
                  <input
                    type="date"
                    value={payPeriodEnd}
                    onChange={(e) => setPayPeriodEnd(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end space-x-2 pt-6">
                  <button
                    onClick={() => {
                      const start = parseISO(payPeriodStart);
                      setPayPeriodStart(format(subDays(start, 7), 'yyyy-MM-dd'));
                      setPayPeriodEnd(format(subDays(parseISO(payPeriodEnd), 7), 'yyyy-MM-dd'));
                    }}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    ← Previous Week
                  </button>
                  <button
                    onClick={() => {
                      const start = parseISO(payPeriodStart);
                      setPayPeriodStart(format(addDays(start, 7), 'yyyy-MM-dd'));
                      setPayPeriodEnd(format(addDays(parseISO(payPeriodEnd), 7), 'yyyy-MM-dd'));
                    }}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Next Week →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Excel-like Time Entry Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Bulk Project Selector */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Select Project for All Rows:
              </label>
              <select
                value={bulkProject}
                onChange={(e) => {
                  const selectedProject = e.target.value;
                  setBulkProject(selectedProject);
                  if (selectedProject) {
                    const newRows = tableRows.map(row => ({
                      ...row,
                      project: selectedProject,
                    }));
                    setTableRows(newRows);
                    // Reset to "Select Project" after applying
                    setTimeout(() => setBulkProject(''), 100);
                  }
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="">Select Project</option>
                {!projects.find(p => p.name === 'Onyx Government Services TTB') && (
                  <option value="Onyx Government Services TTB">Onyx Government Services TTB</option>
                )}
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Hours
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableRows.map((row, index) => {
                  const dayOfWeek = format(parseISO(row.date), 'EEE');
                  const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
                  
                  return (
                    <tr 
                      key={row.date} 
                      className={`hover:bg-gray-50 ${isWeekend ? 'bg-gray-50' : ''}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                        <div>
                          <div>{format(parseISO(row.date), 'MMM dd, yyyy')}</div>
                          <div className="text-xs text-gray-500">{dayOfWeek}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max="24"
                          value={row.hours}
                          onChange={(e) => updateTableCell(index, 'hours', e.target.value)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        <select
                          value={row.project}
                          onChange={(e) => updateTableCell(index, 'project', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                          required
                        >
                          <option value="">Select Project</option>
                          {/* Always include Onyx Government Services TTB */}
                          {!projects.find(p => p.name === 'Onyx Government Services TTB') && (
                            <option value="Onyx Government Services TTB">Onyx Government Services TTB</option>
                          )}
                          {projects.map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => updateTableCell(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="What did you work on?"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-gray-500">Designed by nm2tech - mAIchael</p>
        </div>
      </footer>
      <HelpChatbot />
    </div>
  );
}

