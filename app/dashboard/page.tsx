'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays } from 'date-fns';
import { LogOut, Plus, Edit2, Trash2, Clock, Save, Calendar, Send, CheckCircle } from 'lucide-react';
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
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
}

interface TableRow {
  date: string;
  hours: string;
  project: string;
  description: string;
  entryId?: string; // If this row has an existing entry
  status?: 'draft' | 'submitted' | 'approved' | 'rejected'; // Status of the entry
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
  const [submitting, setSubmitting] = useState(false);
  const [bulkProject, setBulkProject] = useState('');
  // Use refs for synchronous guards (React state updates are async)
  const isSavingRef = useRef(false);
  const isSubmittingRef = useRef(false);

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
      // Ensure entryId is always a string to prevent number precision issues
      const entryId = existingEntry?.id ? String(existingEntry.id) : undefined;
      const row = {
        date: dateStr,
        hours: existingEntry ? existingEntry.hours.toString() : '',
        project: existingEntry ? existingEntry.project : '',
        description: existingEntry ? existingEntry.description : '',
        entryId: entryId, // Always ensure it's a string
        status: existingEntry?.status || 'draft', // Explicitly set status, default to 'draft'
      };
      
      // Debug: Log entryId to catch any precision issues
      if (entryId && entryId.length > 10) {
        console.log(`Table row for ${dateStr} has entryId:`, entryId, 'Length:', entryId.length, 'Type:', typeof entryId);
      }
      
      // Debug: Log if entry has submitted/approved status
      if (row.status === 'submitted' || row.status === 'approved') {
        console.log(`Table row for ${dateStr} has status: ${row.status}, entryId: ${row.entryId}`);
      }
      
      return row;
    });
    
    setTableRows(rows);
  };

  // Generate table rows when pay period or entries change
  useEffect(() => {
    if (payPeriodStart && payPeriodEnd && projects.length > 0) {
      generateTableRows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payPeriodStart, payPeriodEnd, entries, projects]);

  const loadData = async () => {
    try {
      const basePath = getBasePath();
      
      // API routes - include basePath if in production
      const [userRes, entriesRes, projectsRes] = await Promise.all([
        fetch(`${basePath}/api/auth/me`, { credentials: 'include' }),
        fetch(`${basePath}/api/time-entries`, { credentials: 'include' }),
        fetch(`${basePath}/api/projects`, { credentials: 'include' }),
      ]);

      // Check for 401 errors on any request
      if (userRes.status === 401 || entriesRes.status === 401 || projectsRes.status === 401) {
        console.log('Authentication failed (401), redirecting to login');
        // Clear any stale token
        document.cookie = 'token=; path=/; max-age=0';
        router.push('/login');
        return;
      }

      // Check if responses are ok before parsing JSON
      if (!userRes.ok) {
        console.error('Failed to load user data:', userRes.status, userRes.statusText);
        throw new Error(`Failed to load user data: ${userRes.status}`);
      }

      const userData = await userRes.json();
      
      // Redirect admins to admin dashboard
      if (userData.user?.role === 'admin') {
        router.push('/admin');
        return;
      }

      if (!entriesRes.ok) {
        console.error('Failed to load entries:', entriesRes.status, entriesRes.statusText);
        throw new Error(`Failed to load entries: ${entriesRes.status}`);
      }

      if (!projectsRes.ok) {
        console.error('Failed to load projects:', projectsRes.status, projectsRes.statusText);
        throw new Error(`Failed to load projects: ${projectsRes.status}`);
      }

      const entriesData = await entriesRes.json();
      const projectsData = await projectsRes.json();

      setUser(userData.user);
      
      // Ensure all entry IDs are strings to prevent number precision issues
      const entriesWithStringIds = (entriesData.entries || []).map((entry: TimeEntry) => ({
        ...entry,
        id: String(entry.id), // Always ensure ID is a string
      }));
      
      setEntries(entriesWithStringIds);
      setProjects(projectsData.projects || []);
      
      // Debug: Log projects to see what's being loaded
      console.log('Loaded projects:', projectsData.projects);
      // Debug: Log entries to see their status
      const entriesWithStatus = entriesData.entries?.map((e: TimeEntry) => ({ 
        id: e.id,
        date: e.date, 
        status: e.status || 'draft',
        hours: e.hours,
        project: e.project
      }));
      console.log('Loaded entries with status:', entriesWithStatus);
      
      // Check for submitted entries
      const submittedEntries = entriesData.entries?.filter((e: TimeEntry) => e.status === 'submitted' || e.status === 'approved');
      if (submittedEntries && submittedEntries.length > 0) {
        console.log(`Found ${submittedEntries.length} submitted/approved entries:`, submittedEntries.map((e: TimeEntry) => ({ date: e.date, status: e.status })));
      }
      
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
    console.log('handleBulkSave called', { 
      tableRowsCount: tableRows.length, 
      saving: isSavingRef.current, 
      submitting: isSubmittingRef.current 
    });
    
    // Prevent multiple simultaneous saves using ref (synchronous check)
    if (isSavingRef.current || isSubmittingRef.current) {
      console.log('Already saving or submitting, ignoring click');
      return;
    }
    
    // Set ref and state immediately to disable button
    isSavingRef.current = true;
    setSaving(true);
    
    try {
      // Log all table rows for debugging
      console.log('All table rows:', tableRows.map(r => ({ 
        date: r.date, 
        hours: r.hours, 
        project: r.project, 
        entryId: r.entryId 
      })));
      
      // Separate rows into:
      // 1. Rows with hours entered (including 0) - to save/update
      // 2. Rows with entryId but empty/blank hours - to delete
      const rowsWithHours = tableRows.filter(row => {
        // Include rows that have hours entered (even if 0) and a project selected
        const hoursStr = row.hours?.trim() || '';
        const hasHoursValue = hoursStr !== '' && !isNaN(parseFloat(hoursStr));
        return hasHoursValue;
      });
      
      const rowsToDelete = tableRows.filter(row => {
        // Delete only if there's an existing entry but hours field is empty/blank
        const hoursStr = row.hours?.trim() || '';
        const isHoursEmpty = hoursStr === '';
        // Only delete if entry exists and hours field is completely empty
        return row.entryId && isHoursEmpty;
      });
      
      console.log(`Found ${rowsWithHours.length} rows with hours, ${rowsToDelete.length} rows to delete out of ${tableRows.length} total rows`);
      
      // Process deletions first
      const basePath = getBasePath();
      const deleteResults: PromiseSettledResult<any>[] = [];
      if (rowsToDelete.length > 0) {
        console.log('Deleting entries:', rowsToDelete.map(r => ({ date: r.date, entryId: r.entryId })));
        deleteResults.push(...await Promise.allSettled(
          rowsToDelete.map(async (row) => {
            if (!row.entryId) return null;
            
            const url = `${basePath}/api/time-entries/${row.entryId}`;
            console.log(`DELETE ${url} for date ${row.date}`);
            
            const res = await fetch(url, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });

            if (!res.ok) {
              let errorMessage = 'Failed to delete entry';
              try {
                const errorData = await res.json();
                errorMessage = errorData.error || errorMessage;
                console.error(`Failed to delete entry for ${row.date}:`, errorData);
              } catch {
                errorMessage = `Server error: ${res.status} ${res.statusText}`;
                console.error(`Failed to delete entry for ${row.date}:`, res.status, res.statusText);
              }
              throw new Error(`${errorMessage} (${format(parseISO(row.date), 'MMM dd, yyyy')})`);
            }
            
            console.log(`Successfully deleted entry for ${row.date}`);
            return { date: row.date, entryId: row.entryId };
          })
        ));
      }
      
      // Check if we have anything to save or delete
      if (rowsWithHours.length === 0 && rowsToDelete.length === 0) {
        alert('No changes to save. Please enter hours for at least one day, or delete existing entries by clearing their hours.');
        isSavingRef.current = false;
        setSaving(false);
        return;
      }
      
      // Process saves/updates - filter out entries without projects and approved/submitted entries
      const entriesToSave = rowsWithHours
        .map(row => {
          const hours = parseFloat(row.hours);
          const project = row.project?.trim();
          
          console.log(`Processing row for ${row.date}: hours="${row.hours}" -> ${hours}, project="${project}", entryId="${row.entryId}", status="${row.status}"`);
          
          // Skip entries without projects (don't throw, just skip)
          if (!project || project === '') {
            console.warn(`Skipping entry for ${row.date}: project is required but not selected`);
            return null;
          }
          
          // Allow 0 hours (for days off, etc.)
          if (isNaN(hours)) {
            console.warn(`Skipping entry for ${row.date}: invalid hours value "${row.hours}"`);
            return null;
          }
          
          // Skip approved entries for non-admins (these cannot be edited via the API)
          // Admins can edit approved entries
          // Submitted entries can be edited - they will revert to draft status
          if (row.entryId) {
            const originalEntry = entries.find(e => String(e.id) === String(row.entryId));
            if (originalEntry) {
              const isApproved = originalEntry.status === 'approved';
              const isAdmin = user?.role === 'admin';
              if (isApproved && !isAdmin) {
                // Non-admins cannot edit approved entries - skip them
                console.log(`Skipping entry for ${row.date}: cannot edit approved entries (admin only)`);
                return null;
              }
            }
          }
          
          // Ensure entryId is always a string to prevent number precision issues
          const entryId = row.entryId ? String(row.entryId) : undefined;
          
          return {
            date: row.date,
            hours: hours, // Can be 0
            project: project,
            description: (row.description || '').trim(),
            entryId: entryId, // Always ensure it's a string
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
      
      // Check if we have any entries to save after filtering
      const skippedCount = rowsWithHours.length - entriesToSave.length;
      const isAdmin = user?.role === 'admin';
      const skippedApproved = rowsWithHours.filter(row => {
        if (!row.entryId) return false;
        const originalEntry = entries.find(e => String(e.id) === String(row.entryId));
        return originalEntry && originalEntry.status === 'approved' && !isAdmin;
      }).length;
      
      if (skippedCount > 0) {
        if (skippedApproved > 0) {
          console.log(`Skipped ${skippedApproved} approved entries (admin only), and ${skippedCount - skippedApproved} entries due to missing project or invalid hours`);
        } else {
          console.warn(`Skipped ${skippedCount} entries due to missing project or invalid hours`);
        }
      }

      console.log('Entries to save:', entriesToSave.map(e => ({ date: e.date, hours: e.hours, project: e.project, entryId: e.entryId })));

      if (entriesToSave.length === 0) {
        if (rowsWithHours.length > 0) {
          alert(`No entries to save. Please select a project for the entries with hours entered.\n\n${skippedCount} entry/entries skipped due to missing project.`);
        } else {
          alert('No entries to save. Please enter hours for at least one day.');
        }
        isSavingRef.current = false;
        setSaving(false);
        return;
      }

      // Save each entry (create or update) with better error handling
      console.log('Saving entries with basePath:', basePath, 'entriesToSave:', entriesToSave.length);
      const results = await Promise.allSettled(
        entriesToSave.map(async (entry) => {
          // Ensure entryId is a string and valid
          const entryId = entry.entryId ? String(entry.entryId).trim() : null;
          if (entryId && entryId.length === 0) {
            console.warn(`Invalid entryId for entry ${entry.date}, treating as new entry`);
          }
          
          const url = entryId && entryId.length > 0
            ? `${basePath}/api/time-entries/${encodeURIComponent(entryId)}`
            : `${basePath}/api/time-entries`;
          
          const method = entryId && entryId.length > 0 ? 'PUT' : 'POST';
          
          console.log(`${method} ${url}`, { 
            date: entry.date, 
            hours: entry.hours, 
            project: entry.project, 
            entryId: entryId,
            originalEntryId: entry.entryId,
            entryIdType: typeof entry.entryId,
            entryIdLength: entryId ? entryId.length : 0
          });
          
          const requestBody = {
            date: entry.date,
            hours: entry.hours, // Can be 0
            project: entry.project,
            description: entry.description,
          };
          
          console.log(`Sending ${method} request:`, {
            url,
            body: requestBody,
            hoursValue: requestBody.hours,
            hoursType: typeof requestBody.hours,
            hoursIsZero: requestBody.hours === 0,
          });
          
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(requestBody),
          });

          if (!res.ok) {
            let errorMessage = 'Failed to save entry';
            let errorDetails: any = null;
            try {
              const errorData = await res.json();
              // Use message if available, otherwise use error
              errorMessage = errorData.message || errorData.error || errorMessage;
              errorDetails = errorData;
              console.error(`Failed to save entry for ${entry.date}:`, {
                status: res.status,
                statusText: res.statusText,
                error: errorData.error,
                message: errorData.message,
                details: errorData.details,
                fullError: errorData
              });
            } catch (parseError) {
              errorMessage = `Server error: ${res.status} ${res.statusText}`;
              console.error(`Failed to save entry for ${entry.date}:`, res.status, res.statusText, parseError);
            }
            
            // Always show the error message from the server
            throw new Error(`${errorMessage} (${format(parseISO(entry.date), 'MMM dd, yyyy')})`);
          }
          
          const responseData = await res.json();
          console.log(`Successfully saved entry for ${entry.date}:`, responseData);
          
          if (!responseData.entry) {
            console.warn(`Response missing entry data for ${entry.date}:`, responseData);
            // Still return the entry we tried to save, but log a warning
            return entry;
          }
          
          // Ensure the returned entry has a string ID to prevent precision issues
          const savedEntry = {
            ...responseData.entry,
            id: String(responseData.entry.id),
          };
          console.log(`Returning saved entry with string ID:`, savedEntry.id, 'Type:', typeof savedEntry.id);
          return savedEntry;
        })
      );

      // Check for failures in both saves and deletes
      const saveFailures = results.filter(r => r.status === 'rejected');
      const saveSuccesses = results.filter(r => r.status === 'fulfilled' && r.value);
      const deleteFailures = deleteResults.filter(r => r.status === 'rejected');
      const deleteSuccesses = deleteResults.filter(r => r.status === 'fulfilled' && r.value);

      console.log(`Save results: ${saveSuccesses.length} succeeded, ${saveFailures.length} failed`);
      console.log(`Delete results: ${deleteSuccesses.length} succeeded, ${deleteFailures.length} failed`);
      console.log('Save success details:', saveSuccesses.map(s => s.status === 'fulfilled' ? { date: s.value?.date, id: s.value?.id, hours: s.value?.hours } : null));
      console.log('Delete success details:', deleteSuccesses.map(s => s.status === 'fulfilled' ? { date: s.value?.date, entryId: s.value?.entryId } : null));
      console.log('Save failure details:', saveFailures.map(f => f.status === 'rejected' ? f.reason : null));
      console.log('Delete failure details:', deleteFailures.map(f => f.status === 'rejected' ? f.reason : null));

      const allFailures = [...saveFailures, ...deleteFailures];
      const totalSuccesses = saveSuccesses.length + deleteSuccesses.length;

      if (allFailures.length > 0) {
        const errorMessages = allFailures.map(f => 
          f.status === 'rejected' ? f.reason?.message || 'Unknown error' : ''
        ).filter(Boolean).join('\n');
        const successMessage = totalSuccesses > 0 
          ? `${saveSuccesses.length} entries saved, ${deleteSuccesses.length} entries deleted.`
          : 'No operations completed successfully.';
        alert(`Some operations failed:\n\n${errorMessages}\n\n${successMessage}`);
      } else if (totalSuccesses > 0) {
        const messages = [];
        if (saveSuccesses.length > 0) messages.push(`${saveSuccesses.length} entries saved`);
        if (deleteSuccesses.length > 0) messages.push(`${deleteSuccesses.length} entries deleted`);
        alert(`Successfully ${messages.join(' and ')}!`);
      } else {
        console.error('No operations were completed and no errors were reported. This is unexpected.');
        alert('No changes were made. Please check the console for details.');
      }
      
      // Update entries state: remove deleted entries and update/add saved entries
      const deletedEntryIds = deleteSuccesses
        .filter(s => s.status === 'fulfilled' && s.value)
        .map(s => s.status === 'fulfilled' ? s.value?.entryId : null)
        .filter(Boolean) as string[];
      
      if (deletedEntryIds.length > 0 || saveSuccesses.length > 0) {
        setEntries(prevEntries => {
          // Remove deleted entries
          let updatedEntries = prevEntries.filter(e => !deletedEntryIds.includes(e.id));
          
        // Add/update saved entries
        const savedEntries = saveSuccesses
          .filter(s => s.status === 'fulfilled' && s.value)
          .map(s => s.status === 'fulfilled' ? s.value : null)
          .filter(Boolean)
          .map((entry: TimeEntry) => ({
            ...entry,
            id: String(entry.id), // Ensure ID is always a string
          })) as TimeEntry[];
        
        savedEntries.forEach(savedEntry => {
          const index = updatedEntries.findIndex(e => String(e.id) === String(savedEntry.id));
          if (index >= 0) {
            // Update existing entry
            updatedEntries[index] = savedEntry;
          } else {
            // Add new entry
            updatedEntries.push(savedEntry);
          }
        });
          
          console.log('Updated entries state:', { 
            deleted: deletedEntryIds.length, 
            saved: savedEntries.length,
            total: updatedEntries.length 
          });
          return updatedEntries;
        });
        
        // Also update table rows immediately
        setTableRows(prevRows => {
          const updatedRows: TableRow[] = prevRows.map(row => {
            // If this row was deleted, clear it
            if (row.entryId && deletedEntryIds.includes(row.entryId)) {
              console.log(`Clearing table row for ${row.date} (entry deleted)`);
              return {
                ...row,
                hours: '',
                project: '',
                description: '',
                entryId: undefined,
                status: 'draft' as const,
              };
            }
            
            // If this row was saved, update it
            const savedEntry = saveSuccesses
              .filter(s => s.status === 'fulfilled' && s.value)
              .map(s => s.status === 'fulfilled' ? s.value : null)
              .find((e: TimeEntry | null) => e && e.date === row.date);
            
            if (savedEntry) {
              console.log(`Updating table row for ${row.date} with saved entry:`, { hours: savedEntry.hours, project: savedEntry.project, id: savedEntry.id, status: savedEntry.status });
              // Note: Rejected and submitted entries that are saved will automatically become 'draft' status
              // This allows users to fix and resubmit rejected/submitted entries
              const entryStatus = savedEntry.status as 'draft' | 'submitted' | 'approved' | 'rejected' | undefined;
              return {
                ...row,
                hours: savedEntry.hours.toString(),
                project: savedEntry.project,
                description: savedEntry.description,
                entryId: String(savedEntry.id),
                status: entryStatus || 'draft',
              };
            }
            
            return row;
          });
          console.log('Updated table rows:', updatedRows.map(r => ({ date: r.date, hours: r.hours, entryId: r.entryId })));
          return updatedRows;
        });
      }
      
      // Reload data to get updated entries with status (this will trigger useEffect to regenerate table rows)
      await loadData();
    } catch (error) {
      console.error('Error saving entries:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error
      });
      const errorMessage = error instanceof Error ? error.message : 'Failed to save entries';
      alert(`Error saving entries: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      // Always reset refs and state, even if there was an error
      console.log('Resetting save state');
      isSavingRef.current = false;
      setSaving(false);
    }
  };

  // Submit entries for approval
  const handleSubmitForApproval = async () => {
    console.log('handleSubmitForApproval called');
    
    // Prevent multiple simultaneous submissions using ref (synchronous check)
    if (isSubmittingRef.current || isSavingRef.current) {
      console.log('Already submitting or saving, ignoring click');
      return;
    }
    
    // Set ref and state IMMEDIATELY before confirm dialog to prevent multiple clicks
    isSubmittingRef.current = true;
    setSubmitting(true);
    
    // Small delay to ensure state update is processed
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (!confirm('Are you sure you want to submit these time entries for approval? You won\'t be able to edit them until they are approved or rejected.')) {
      console.log('User cancelled submission');
      // Reset ref and state if user cancels
      isSubmittingRef.current = false;
      setSubmitting(false);
      return;
    }
    try {
      const basePath = getBasePath();
      console.log('Submitting entries with basePath:', basePath);
      
      // First, save any unsaved entries in the table (they need to exist in the database first)
      const unsavedRows = tableRows.filter(row => {
        const hours = parseFloat(row.hours);
        const hasHours = row.hours && !isNaN(hours) && hours > 0;
        const hasProject = row.project?.trim();
        const rowDate = parseISO(row.date);
        const start = parseISO(payPeriodStart);
        const end = parseISO(payPeriodEnd);
        const inPayPeriod = rowDate >= start && rowDate <= end;
        return hasHours && hasProject && !row.entryId && inPayPeriod;
      });

      // Save unsaved entries first
      if (unsavedRows.length > 0) {
        const saveResults = await Promise.allSettled(
          unsavedRows.map(async (row) => {
            const hours = parseFloat(row.hours);
            const res = await fetch(`${basePath}/api/time-entries`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                date: row.date,
                hours: hours,
                project: row.project.trim(),
                description: (row.description || '').trim(),
              }),
            });

            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || 'Failed to save entry');
            }
            const data = await res.json();
            return data.entry;
          })
        );

        const saveFailures = saveResults.filter(r => r.status === 'rejected');
        if (saveFailures.length > 0) {
          alert(`Failed to save ${saveFailures.length} entries. Please try again.`);
          setSubmitting(false);
          return;
        }

        // Reload data to get the newly saved entries
        await loadData();
      }
      
      // Get all draft or rejected entries in the current pay period (including newly saved ones)
      // Filter out entries that are already submitted or approved
      const entriesToSubmit = entries.filter(entry => {
        const entryDate = parseISO(entry.date);
        const start = parseISO(payPeriodStart);
        const end = parseISO(payPeriodEnd);
        const inPayPeriod = entryDate >= start && entryDate <= end;
        const isDraftOrRejected = entry.status === 'draft' || entry.status === 'rejected' || !entry.status;
        const notAlreadySubmitted = entry.status !== 'submitted' && entry.status !== 'approved';
        
        return inPayPeriod && isDraftOrRejected && notAlreadySubmitted;
      });
      
      console.log(`Filtered entries to submit: ${entriesToSubmit.length} draft/rejected entries (out of ${entries.length} total entries in pay period)`);

      if (entriesToSubmit.length === 0) {
        alert('No draft or rejected entries found in the current pay period to submit. Please save your entries first using "Save as Draft".');
        setSubmitting(false);
        return;
      }

      // Submit each entry (deduplicate by entry ID to prevent double submission)
      const uniqueEntries = Array.from(
        new Map(entriesToSubmit.map(entry => [entry.id, entry])).values()
      );
      
      console.log(`Submitting ${uniqueEntries.length} unique entries (${entriesToSubmit.length} total, ${entriesToSubmit.length - uniqueEntries.length} duplicates removed)`);
      
      // Double-check entries are still draft before submitting (prevent race condition)
      const validEntries = uniqueEntries.filter(entry => {
        const isStillDraft = entry.status === 'draft' || !entry.status;
        if (!isStillDraft) {
          console.warn(`Entry ${entry.id} is no longer draft (status: ${entry.status}), skipping submission`);
        }
        return isStillDraft;
      });
      
      if (validEntries.length === 0) {
        alert('No valid draft entries to submit. Some entries may have already been submitted.');
        isSubmittingRef.current = false;
        setSubmitting(false);
        return;
      }
      
      const results = await Promise.allSettled(
        validEntries.map(async (entry) => {
          console.log(`Submitting entry ${entry.id} for date ${entry.date}, current status: ${entry.status || 'draft'}`);
          const res = await fetch(`${basePath}/api/time-entries/${entry.id}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (!res.ok) {
            let errorMessage = 'Failed to submit entry';
            try {
              const errorData = await res.json();
              errorMessage = errorData.error || errorMessage;
              console.error(`Failed to submit entry ${entry.id}:`, errorData);
            } catch (parseError) {
              errorMessage = `Server error: ${res.status} ${res.statusText}`;
              console.error(`Failed to submit entry ${entry.id}:`, res.status, res.statusText);
            }
            throw new Error(errorMessage);
          }
          const responseData = await res.json();
          console.log(`Successfully submitted entry ${entry.id}:`, responseData);
          return entry;
        })
      );

      const failures = results.filter(r => r.status === 'rejected');
      const successes = results.filter(r => r.status === 'fulfilled');

      if (failures.length > 0) {
        const errorMessages = failures.map(f => 
          f.status === 'rejected' ? f.reason?.message || 'Unknown error' : ''
        ).join('\n');
        alert(`Some entries failed to submit:\n\n${errorMessages}\n\n${successes.length} entries submitted successfully.`);
      } else {
        alert(`Successfully submitted ${successes.length} time entries for approval!`);
      }
      
      // Reload data to get updated entries with submitted status
      await loadData();
      // Force regenerate table rows to reflect updated status
      if (payPeriodStart && payPeriodEnd && projects.length > 0) {
        generateTableRows();
      }
    } catch (error) {
      console.error('Error submitting entries:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to submit entries'}`);
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const basePath = getBasePath();
      const url = editingEntry 
        ? `${basePath}/api/time-entries/${editingEntry.id}`
        : `${basePath}/api/time-entries`;
      
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
      const basePath = getBasePath();
      const res = await fetch(`${basePath}/api/time-entries/${id}`, {
        method: 'DELETE',
        credentials: 'include',
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
  
  // Get entries in the current pay period
  const entriesInPayPeriod = entries.filter(entry => {
    const entryDate = parseISO(entry.date);
    const start = parseISO(payPeriodStart);
    const end = parseISO(payPeriodEnd);
    return entryDate >= start && entryDate <= end;
  });
  
  // Check if all entries in the pay period are submitted/approved
  // Rejected entries are NOT considered "submitted" since they can be resubmitted
  // Only true if there are entries AND all of them are submitted/approved (not rejected or draft)
  const allEntriesSubmitted = entriesInPayPeriod.length > 0 && 
    entriesInPayPeriod.every(entry => 
      entry.status === 'submitted' || entry.status === 'approved'
    );
  
  // Check if there are any draft or rejected entries to submit OR unsaved/modified entries in the table
  const hasDraftEntries = (() => {
    // First check entries array
    const draftEntriesInArray = entries.filter(entry => {
      const entryDate = parseISO(entry.date);
      const start = parseISO(payPeriodStart);
      const end = parseISO(payPeriodEnd);
      const inPayPeriod = entryDate >= start && entryDate <= end;
      const isDraftOrRejected = entry.status === 'draft' || entry.status === 'rejected' || !entry.status;
      return inPayPeriod && isDraftOrRejected;
    });
    
    if (draftEntriesInArray.length > 0) {
      console.log('hasDraftEntries: Found draft/rejected entries in array:', draftEntriesInArray.map(e => ({ date: e.date, status: e.status })));
      return true;
    }
    
    // Then check table rows
    const draftRows = tableRows.filter(row => {
    const hours = parseFloat(row.hours || '0');
    const hasHours = row.hours && !isNaN(hours) && hours >= 0; // Allow 0 hours
    const hasProject = row.project?.trim();
    const rowDate = parseISO(row.date);
    const start = parseISO(payPeriodStart);
    const end = parseISO(payPeriodEnd);
    const inPayPeriod = rowDate >= start && rowDate <= end;
    
    // Check for new entries (no entryId) with hours and project
    if (hasHours && hasProject && !row.entryId && inPayPeriod) {
      return true;
    }
    
    // Check for existing entries that have been modified in the table
    // (have entryId but hours/project changed from original entry)
    if (row.entryId && hasHours && hasProject && inPayPeriod) {
      // First check the row's own status (most reliable)
      const rowStatus = row.status || 'draft';
      const isRowDraftOrRejected = rowStatus === 'draft' || rowStatus === 'rejected';
      
      if (isRowDraftOrRejected) {
        return true;
      }
      
      // Also check against original entry in case row status is stale
      const originalEntry = entries.find(e => String(e.id) === String(row.entryId));
      if (originalEntry) {
        // Entry exists - check if it's draft/rejected status or if values have changed
        const isDraftOrRejected = originalEntry.status === 'draft' || originalEntry.status === 'rejected' || !originalEntry.status;
        const originalHours = parseFloat(originalEntry.hours.toString());
        // Use small epsilon for floating point comparison
        const hoursChanged = Math.abs(originalHours - hours) > 0.001;
        const projectChanged = originalEntry.project !== row.project;
        return isDraftOrRejected || hoursChanged || projectChanged;
      }
      // Entry ID exists but not found in entries (might be newly created)
      return true;
    }
    
    return false;
    });
    
    if (draftRows.length > 0) {
      console.log('hasDraftEntries: Found draft/rejected entries in table rows:', draftRows.map(r => ({ date: r.date, status: r.status, entryId: r.entryId })));
      return true;
    }
    
    console.log('hasDraftEntries: No draft/rejected entries found');
    return false;
  })();

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
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  console.log('Save button clicked', { 
                    saving, 
                    submitting, 
                    isSavingRef: isSavingRef.current, 
                    isSubmittingRef: isSubmittingRef.current,
                    tableRows: tableRows.length 
                  });
                  
                  // Prevent multiple clicks using refs (synchronous check)
                  if (isSavingRef.current || isSubmittingRef.current) {
                    console.log('Save button: Already saving/submitting, ignoring click');
                    alert('A save or submit operation is already in progress. Please wait...');
                    return;
                  }
                  
                  // Double-check state (in case refs are out of sync)
                  if (saving || submitting) {
                    console.log('Save button: State indicates already saving/submitting');
                    return;
                  }
                  
                  try {
                    await handleBulkSave();
                  } catch (error) {
                    console.error('Error in save button onClick handler:', error);
                    alert(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                disabled={saving || submitting}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={saving ? 'Saving entries...' : submitting ? 'Cannot save while submitting' : 'Save all entries as draft'}
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Save as Draft'}</span>
              </button>
              {allEntriesSubmitted ? (
                <button
                  disabled
                  className="flex items-center space-x-2 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Submitted</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Prevent multiple clicks using refs (synchronous check)
                    if (isSubmittingRef.current || isSavingRef.current) {
                      console.log('Submit button: Already submitting/saving, ignoring click');
                      return;
                    }
                    console.log('Submit button clicked', { 
                      submitting, 
                      saving, 
                      hasDraftEntries, 
                      entries: entries.length, 
                      tableRows: tableRows.length,
                      allEntriesSubmitted,
                      entriesInPayPeriod: entriesInPayPeriod.length
                    });
                    handleSubmitForApproval();
                  }}
                  disabled={submitting || saving || !hasDraftEntries}
                  className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={(() => {
                    if (submitting) return 'Submitting entries...';
                    if (saving) return 'Cannot submit while saving';
                    if (!hasDraftEntries) {
                      const rejectedCount = entries.filter(e => {
                        const entryDate = parseISO(e.date);
                        const start = parseISO(payPeriodStart);
                        const end = parseISO(payPeriodEnd);
                        return entryDate >= start && entryDate <= end && e.status === 'rejected';
                      }).length;
                      const draftCount = entries.filter(e => {
                        const entryDate = parseISO(e.date);
                        const start = parseISO(payPeriodStart);
                        const end = parseISO(payPeriodEnd);
                        return entryDate >= start && entryDate <= end && (e.status === 'draft' || !e.status);
                      }).length;
                      return `No draft or rejected entries to submit. Found ${draftCount} draft and ${rejectedCount} rejected entries in pay period.`;
                    }
                    return 'Submit entries for approval';
                  })()}
                >
                  <Send className="w-5 h-5" />
                  <span>{submitting ? 'Submitting...' : 'Submit for Approval'}</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Pay Period Selector */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center space-x-4">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="flex items-center space-x-4">
                <div>
                  <label htmlFor="pay-period-start" className="block text-sm font-medium text-gray-700 mb-1">
                    Pay Period Start
                  </label>
                  <input
                    id="pay-period-start"
                    name="pay-period-start"
                    type="date"
                    value={payPeriodStart}
                    onChange={(e) => setPayPeriodStart(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="pay-period-end" className="block text-sm font-medium text-gray-700 mb-1">
                    Pay Period End
                  </label>
                  <input
                    id="pay-period-end"
                    name="pay-period-end"
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
              <label htmlFor="bulk-project-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Select Project for All Rows:
              </label>
              <select
                id="bulk-project-select"
                name="bulk-project-select"
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
                  const isLocked = row.status === 'submitted' || row.status === 'approved';
                  
                  return (
                    <tr 
                      key={row.date} 
                      className={`hover:bg-gray-50 ${isWeekend ? 'bg-gray-50' : ''} ${isLocked ? 'opacity-75' : ''}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                        <div>
                          <div>{format(parseISO(row.date), 'MMM dd, yyyy')}</div>
                          <div className="text-xs text-gray-500">{dayOfWeek}</div>
                          {row.status && (
                            <div className="mt-1">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                row.status === 'approved' 
                                  ? 'bg-green-100 text-green-800'
                                  : row.status === 'submitted'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : row.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {row.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                        <label htmlFor={`hours-${index}`} className="sr-only">Hours for {format(parseISO(row.date), 'MMM dd, yyyy')}</label>
                        <input
                          id={`hours-${index}`}
                          name={`hours-${index}`}
                          type="number"
                          step="0.25"
                          min="0"
                          max="24"
                          value={row.hours}
                          onChange={(e) => updateTableCell(index, 'hours', e.target.value)}
                          disabled={isLocked}
                          className={`w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          placeholder="0.00"
                          aria-label={`Hours for ${format(parseISO(row.date), 'MMM dd, yyyy')}`}
                        />
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        <label htmlFor={`project-${index}`} className="sr-only">Project for {format(parseISO(row.date), 'MMM dd, yyyy')}</label>
                        <select
                          id={`project-${index}`}
                          name={`project-${index}`}
                          value={row.project}
                          onChange={(e) => updateTableCell(index, 'project', e.target.value)}
                          disabled={isLocked}
                          className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          required
                          aria-label={`Project for ${format(parseISO(row.date), 'MMM dd, yyyy')}`}
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
                        <label htmlFor={`description-${index}`} className="sr-only">Description for {format(parseISO(row.date), 'MMM dd, yyyy')}</label>
                        <input
                          id={`description-${index}`}
                          name={`description-${index}`}
                          type="text"
                          value={row.description}
                          onChange={(e) => updateTableCell(index, 'description', e.target.value)}
                          disabled={isLocked}
                          className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          placeholder="What did you work on?"
                          aria-label={`Description for ${format(parseISO(row.date), 'MMM dd, yyyy')}`}
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

