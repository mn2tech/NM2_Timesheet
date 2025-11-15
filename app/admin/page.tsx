'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { LogOut, Users, Clock, TrendingUp, ArrowLeft, Trash2, Plus, X, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import Link from 'next/link';
import NM2TechLogo from '@/components/NM2TechLogo';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

interface TimeEntry {
  id: string;
  userId: string;
  date: string;
  hours: number;
  project: string;
  description: string;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  userName: string;
  userEmail: string;
  userRole: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'entries' | 'users'>('entries');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected' | 'draft'>('all');
  
  // Helper to get basePath
  const getBasePath = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/nm2timesheet')) {
        return '/nm2timesheet';
      }
    }
    return '';
  };
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'employee' | 'contractor' | 'admin',
  });
  const [addingUser, setAddingUser] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editFormData, setEditFormData] = useState({
    hours: '',
    project: '',
    description: '',
    status: 'draft' as 'draft' | 'submitted' | 'approved' | 'rejected',
  });
  const [savingEntry, setSavingEntry] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const basePath = getBasePath();
      const [userRes, usersRes, entriesRes, projectsRes] = await Promise.all([
        fetch(`${basePath}/api/auth/me`),
        fetch(`${basePath}/api/admin/users`),
        fetch(`${basePath}/api/admin/time-entries`),
        fetch(`${basePath}/api/projects`),
      ]);

      if (userRes.status === 401) {
        router.push('/login');
        return;
      }

      if (userRes.status === 403 || usersRes.status === 403) {
        router.push('/dashboard');
        return;
      }

      // Parse responses properly (each response can only be read once)
      const userData = await userRes.json();
      const usersData = await usersRes.json() as { users: User[] };
      const entriesData = await entriesRes.json();
      const projectsData = await projectsRes.json();

      if (!userData.user) {
        console.error('No user data received');
        router.push('/login');
        return;
      }

      setUser(userData.user);
      setUsers(usersData.users || []);
      setEntries(entriesData.entries || []);
      setProjects(projectsData.projects || []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Show error message to user
      alert(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}. Please refresh the page.`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/');
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingUser(true);

    try {
      const basePath = getBasePath();
      const res = await fetch(`${basePath}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to create user');
        return;
      }

      alert(data.message || 'User created successfully');
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'employee' });
      loadData(); // Reload data to refresh the list
    } catch (error) {
      console.error('Error creating user:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setAddingUser(false);
    }
  };

  const handleApproveEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to approve this time entry?')) {
      return;
    }

    try {
      const basePath = getBasePath();
      const res = await fetch(`${basePath}/api/admin/time-entries/${entryId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        alert(`Server error: ${res.status} ${res.statusText}. Please check the console for details.`);
        return;
      }

      if (!res.ok) {
        console.error('Approve failed:', data);
        alert(data.error || `Failed to approve time entry: ${res.status} ${res.statusText}`);
        return;
      }

      console.log('Approval successful:', data);
      alert('Time entry approved successfully');
      await loadData(); // Reload data to refresh the list
    } catch (error) {
      console.error('Error approving time entry:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred. Please try again.'}`);
    }
  };

  const handleRejectEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to reject this time entry? The user will be able to edit and resubmit it.')) {
      return;
    }

    try {
      const basePath = getBasePath();
      const res = await fetch(`${basePath}/api/admin/time-entries/${entryId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        alert(`Server error: ${res.status} ${res.statusText}. Please check the console for details.`);
        return;
      }

      if (!res.ok) {
        console.error('Reject failed:', data);
        alert(data.error || `Failed to reject time entry: ${res.status} ${res.statusText}`);
        return;
      }

      console.log('Rejection successful:', data);
      alert('Time entry rejected');
      await loadData(); // Reload data to refresh the list
    } catch (error) {
      console.error('Error rejecting time entry:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred. Please try again.'}`);
    }
  };

  // Helper function to get pay period (week) for a date
  const getPayPeriodKey = (date: string): string => {
    const dateObj = parseISO(date);
    const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(dateObj, { weekStartsOn: 1 });
    return `${format(weekStart, 'yyyy-MM-dd')}_${format(weekEnd, 'yyyy-MM-dd')}`;
  };

  // Group entries by user and pay period (for submitted entries only)
  const groupEntriesByPayPeriod = () => {
    const grouped: Record<string, {
      userId: string;
      userName: string;
      userEmail: string;
      payPeriodStart: string;
      payPeriodEnd: string;
      entries: TimeEntry[];
      submittedCount: number;
      totalHours: number;
      days: Array<{ date: string; hours: number; entryId?: string }>;
    }> = {};

    entries
      .filter(entry => entry.status === 'submitted')
      .forEach(entry => {
        const payPeriodKey = getPayPeriodKey(entry.date);
        const key = `${entry.userId}_${payPeriodKey}`;
        
        if (!grouped[key]) {
          const dateObj = parseISO(entry.date);
          const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(dateObj, { weekStartsOn: 1 });
          
          // Generate all days in the pay period
          const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
          const daysData = days.map(day => ({
            date: format(day, 'yyyy-MM-dd'),
            hours: 0,
            entryId: undefined as string | undefined,
          }));
          
          grouped[key] = {
            userId: entry.userId,
            userName: entry.userName,
            userEmail: entry.userEmail,
            payPeriodStart: format(weekStart, 'yyyy-MM-dd'),
            payPeriodEnd: format(weekEnd, 'yyyy-MM-dd'),
            entries: [],
            submittedCount: 0,
            totalHours: 0,
            days: daysData,
          };
        }
        
        grouped[key].entries.push(entry);
        grouped[key].submittedCount++;
        grouped[key].totalHours += entry.hours;
        
        // Update the day's hours in the days array
        const dayIndex = grouped[key].days.findIndex(d => d.date === entry.date);
        if (dayIndex >= 0) {
          grouped[key].days[dayIndex].hours = entry.hours;
          grouped[key].days[dayIndex].entryId = entry.id;
        }
      });

    return Object.values(grouped);
  };

  // Group all entries by user and pay period (for the main entries table)
  const groupAllEntriesByPayPeriod = () => {
    const grouped: Record<string, {
      userId: string;
      userName: string;
      userEmail: string;
      userRole: string;
      payPeriodStart: string;
      payPeriodEnd: string;
      entries: TimeEntry[];
      totalHours: number;
      days: Array<{ 
        date: string; 
        hours: number; 
        entryId?: string;
        status?: string;
        project?: string;
      }>;
    }> = {};

    entries
      .filter(entry => {
        if (statusFilter === 'all') return true;
        return entry.status === statusFilter || (!entry.status && statusFilter === 'draft');
      })
      .forEach(entry => {
        const payPeriodKey = getPayPeriodKey(entry.date);
        const key = `${entry.userId}_${payPeriodKey}`;
        
        if (!grouped[key]) {
          const dateObj = parseISO(entry.date);
          const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(dateObj, { weekStartsOn: 1 });
          
          // Generate all days in the pay period
          const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
          const daysData = days.map(day => ({
            date: format(day, 'yyyy-MM-dd'),
            hours: 0,
            entryId: undefined as string | undefined,
            status: undefined as string | undefined,
            project: undefined as string | undefined,
          }));
          
          grouped[key] = {
            userId: entry.userId,
            userName: entry.userName,
            userEmail: entry.userEmail,
            userRole: entry.userRole,
            payPeriodStart: format(weekStart, 'yyyy-MM-dd'),
            payPeriodEnd: format(weekEnd, 'yyyy-MM-dd'),
            entries: [],
            totalHours: 0,
            days: daysData,
          };
        }
        
        grouped[key].entries.push(entry);
        grouped[key].totalHours += entry.hours;
        
        // Update the day's data in the days array
        const dayIndex = grouped[key].days.findIndex(d => d.date === entry.date);
        if (dayIndex >= 0) {
          grouped[key].days[dayIndex].hours = entry.hours;
          grouped[key].days[dayIndex].entryId = entry.id;
          grouped[key].days[dayIndex].status = entry.status || 'draft';
          grouped[key].days[dayIndex].project = entry.project;
        }
      });

    return Object.values(grouped);
  };

  const handleApprovePayPeriod = async (payPeriodEntries: TimeEntry[]) => {
    const entryIds = payPeriodEntries.map(e => e.id);
    const userName = payPeriodEntries[0]?.userName || 'User';
    const payPeriodStart = payPeriodEntries[0] ? format(parseISO(payPeriodEntries[0].date), 'MMM dd') : '';
    const payPeriodEnd = payPeriodEntries[payPeriodEntries.length - 1] 
      ? format(parseISO(payPeriodEntries[payPeriodEntries.length - 1].date), 'MMM dd, yyyy')
      : '';
    
    if (!confirm(`Are you sure you want to approve all ${entryIds.length} entries for ${userName} (${payPeriodStart} - ${payPeriodEnd})?`)) {
      return;
    }

    try {
      const basePath = getBasePath();
      const res = await fetch(`${basePath}/api/admin/time-entries/bulk-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entryIds }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        alert(`Server error: ${res.status} ${res.statusText}. Please check the console for details.`);
        return;
      }

      if (!res.ok) {
        console.error('Bulk approve failed:', data);
        alert(data.error || `Failed to approve entries: ${res.status} ${res.statusText}`);
        return;
      }

      console.log('Bulk approval successful:', data);
      if (data.errors && data.errors.length > 0) {
        alert(`Approved ${data.approved} of ${data.total} entries. Some errors occurred.`);
      } else {
        alert(`Successfully approved ${data.approved} entries for ${userName}!`);
      }
      await loadData(); // Reload data to refresh the list
    } catch (error) {
      console.error('Error approving pay period:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred. Please try again.'}`);
    }
  };

  const handleDeleteTimeEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) {
      return;
    }

    try {
      const basePath = getBasePath();
      const res = await fetch(`${basePath}/api/admin/time-entries/${entryId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to delete time entry');
        return;
      }

      alert('Time entry deleted successfully');
      loadData(); // Reload data to refresh the list
    } catch (error) {
      console.error('Error deleting time entry:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditFormData({
      hours: entry.hours.toString(),
      project: entry.project,
      description: entry.description || '',
      status: entry.status || 'draft',
    });
  };

  const handleSaveEntry = async () => {
    if (!editingEntry) return;

    const hours = parseFloat(editFormData.hours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      alert('Hours must be a number between 0 and 24');
      return;
    }

    if (!editFormData.project.trim()) {
      alert('Project is required');
      return;
    }

    setSavingEntry(true);
    try {
      const basePath = getBasePath();
      const res = await fetch(`${basePath}/api/time-entries/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          hours: hours,
          project: editFormData.project.trim(),
          description: editFormData.description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to update time entry');
        return;
      }

      alert('Time entry updated successfully');
      setEditingEntry(null);
      await loadData(); // Reload data to refresh the list
    } catch (error) {
      console.error('Error updating time entry:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred. Please try again.'}`);
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This will also delete all their time entries. This action cannot be undone.`)) {
      return;
    }

    try {
      const basePath = getBasePath();
      const res = await fetch(`${basePath}/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to delete user');
        return;
      }

      alert(data.message || 'User deleted successfully');
      loadData(); // Reload data to refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalUsers = users.length;
  const totalEntries = entries.length;

  // Group entries by user
  const entriesByUser = entries.reduce((acc, entry) => {
    if (!acc[entry.userId]) {
      acc[entry.userId] = { name: entry.userName, hours: 0, entries: 0 };
    }
    acc[entry.userId].hours += entry.hours;
    acc[entry.userId].entries += 1;
    return acc;
  }, {} as Record<string, { name: string; hours: number; entries: number }>);

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
              <p className="text-xs text-gray-500 mt-1">Admin Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>User View</span>
              </Link>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {entries.filter(e => e.status === 'submitted').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalHours.toFixed(2)}</p>
              </div>
              <Clock className="w-12 h-12 text-primary-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-primary-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalEntries}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('entries')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'entries'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Time Entries
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'entries' && (
          <div className="space-y-6">
            {/* Pay Period Approval Section (only show when filtering submitted) */}
            {statusFilter === 'submitted' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Approve by Pay Period</h3>
                  <p className="text-sm text-gray-500 mt-1">Approve all submitted entries for a user's pay period at once</p>
                </div>
                <div className="overflow-x-auto">
                  {groupEntriesByPayPeriod().length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500">
                      No submitted entries grouped by pay period
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Period
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mon
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tue
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Wed
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thu
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fri
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sat
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sun
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groupEntriesByPayPeriod()
                          .sort((a, b) => {
                            // Sort by pay period end date (most recent first)
                            return new Date(b.payPeriodEnd).getTime() - new Date(a.payPeriodEnd).getTime();
                          })
                          .map((group) => (
                            <tr key={`${group.userId}_${group.payPeriodStart}`} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{group.userName}</div>
                                  <div className="text-xs text-gray-500">{group.userEmail}</div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {format(parseISO(group.payPeriodStart), 'MMM dd')} - {format(parseISO(group.payPeriodEnd), 'MMM dd')}
                              </td>
                              {group.days.map((day, index) => (
                                <td key={day.date} className="px-2 py-4 text-center text-sm text-gray-900">
                                  {day.hours > 0 ? day.hours.toFixed(2) : '-'}
                                </td>
                              ))}
                              <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                                {group.totalHours.toFixed(2)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleApprovePayPeriod(group.entries)}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-auto"
                                  title="Approve all entries in this pay period"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">Approve</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* All Entries Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Status Filter */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Entries</option>
                    <option value="submitted">Pending Approval (Submitted)</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="draft">Draft</option>
                  </select>
                  {statusFilter === 'submitted' && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                      {entries.filter(e => e.status === 'submitted').length} pending
                    </span>
                  )}
                </div>
              </div>
            <div className="overflow-x-auto">
              {groupAllEntriesByPayPeriod().length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  No time entries found
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mon
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tue
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wed
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thu
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fri
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sat
                      </th>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sun
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupAllEntriesByPayPeriod()
                      .sort((a, b) => {
                        // Sort by pay period end date (most recent first)
                        const dateSort = new Date(b.payPeriodEnd).getTime() - new Date(a.payPeriodEnd).getTime();
                        if (dateSort !== 0) return dateSort;
                        // If same date, sort by user name
                        return a.userName.localeCompare(b.userName);
                      })
                      .map((group) => {
                        // Get the most common status for this pay period (or first entry's status)
                        const statusCounts: Record<string, number> = {};
                        group.entries.forEach(e => {
                          const status = e.status || 'draft';
                          statusCounts[status] = (statusCounts[status] || 0) + 1;
                        });
                        const mostCommonStatus = Object.keys(statusCounts).reduce((a, b) => 
                          statusCounts[a] > statusCounts[b] ? a : b
                        );
                        
                        return (
                          <tr key={`${group.userId}_${group.payPeriodStart}`} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{group.userName}</div>
                                <div className="text-xs text-gray-500">{group.userEmail}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 capitalize">
                                {group.userRole}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {format(parseISO(group.payPeriodStart), 'MMM dd')} - {format(parseISO(group.payPeriodEnd), 'MMM dd')}
                            </td>
                            {group.days.map((day) => {
                              const dayEntry = group.entries.find(e => e.date === day.date);
                              return (
                                <td 
                                  key={day.date} 
                                  className="px-2 py-4 text-center text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={() => dayEntry && handleEditEntry(dayEntry)}
                                  title={dayEntry ? `Click to edit: ${dayEntry.project} - ${day.hours.toFixed(2)}h` : ''}
                                >
                                  {day.hours > 0 ? (
                                    <div className="flex flex-col items-center">
                                      <span className="text-gray-900 font-medium">{day.hours.toFixed(2)}</span>
                                      {day.status && day.status !== 'draft' && (
                                        <span className={`text-xs mt-0.5 ${
                                          day.status === 'approved' 
                                            ? 'text-green-600'
                                            : day.status === 'submitted'
                                            ? 'text-yellow-600'
                                            : day.status === 'rejected'
                                            ? 'text-red-600'
                                            : 'text-gray-500'
                                        }`}>
                                          {day.status.charAt(0).toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                              {group.totalHours.toFixed(2)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                {mostCommonStatus === 'submitted' && (
                                  <>
                                    <button
                                      onClick={() => handleApprovePayPeriod(group.entries.filter(e => e.status === 'submitted'))}
                                      className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                      title="Approve submitted entries"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      <span className="text-xs">Approve</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        const submittedEntries = group.entries.filter(e => e.status === 'submitted');
                                        if (submittedEntries.length > 0) {
                                          handleRejectEntry(submittedEntries[0].id);
                                        }
                                      }}
                                      className="flex items-center space-x-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                      title="Reject submitted entries"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      <span className="text-xs">Reject</span>
                                    </button>
                                  </>
                                )}
                                {mostCommonStatus !== 'submitted' && group.entries.length > 0 && (
                                  <button
                                    onClick={() => {
                                      if (group.entries.length > 0) {
                                        handleDeleteTimeEntry(group.entries[0].id);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-900 transition-colors"
                                    title="Delete entries"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Users</h3>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entries
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((u: User) => {
                      const userStats = entriesByUser[u.id] || { name: u.name, hours: 0, entries: 0 };
                      return (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {u.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {u.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                              u.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'employee'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {userStats.hours.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {userStats.entries}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {u.createdAt ? format(parseISO(u.createdAt as string), 'MMM dd, yyyy') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {u.id !== user?.id && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {u.id === user?.id && (
                              <span className="text-gray-400 text-xs">Current user</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
                <button
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUser({ name: '', email: '', password: '', role: 'employee' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="px-6 py-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'employee' | 'contractor' | 'admin' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="employee">Employee</option>
                    <option value="contractor">Contractor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUser(false);
                      setNewUser({ name: '', email: '', password: '', role: 'employee' });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingUser}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingUser ? 'Adding...' : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Entry Modal */}
        {editingEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Time Entry
                </h3>
                <button
                  onClick={() => setEditingEntry(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={format(parseISO(editingEntry.date), 'MMM dd, yyyy')}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User
                  </label>
                  <input
                    type="text"
                    value={editingEntry.userName}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label htmlFor="edit-hours" className="block text-sm font-medium text-gray-700 mb-1">
                    Hours *
                  </label>
                  <input
                    id="edit-hours"
                    type="number"
                    min="0"
                    max="24"
                    step="0.25"
                    value={editFormData.hours}
                    onChange={(e) => setEditFormData({ ...editFormData, hours: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="8.00"
                  />
                </div>
                <div>
                  <label htmlFor="edit-project" className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  <select
                    id="edit-project"
                    value={editFormData.project}
                    onChange={(e) => setEditFormData({ ...editFormData, project: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.name}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="What did you work on?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      editFormData.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : editFormData.status === 'submitted'
                        ? 'bg-yellow-100 text-yellow-800'
                        : editFormData.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {editFormData.status.charAt(0).toUpperCase() + editFormData.status.slice(1)}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      (Use Approve/Reject buttons to change status)
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEntry}
                  disabled={savingEntry}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingEntry ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-gray-500">Designed by nm2tech - mAIchael</p>
        </div>
      </footer>
    </div>
  );
}

