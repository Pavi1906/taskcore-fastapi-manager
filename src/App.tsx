import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  ListTodo, 
  LogOut, 
  Search, 
  PlusCircle, 
  User, 
  Trash2, 
  Clock, 
  Database,
  Lock,
  Server,
  Activity,
  Layers,
  X,
  CheckCircle2
} from 'lucide-react';
import { authService } from './api/auth';
import { tasksService } from './api/tasks';
import { Task } from './types/task';

// Since the backend model doesn't explicitly store priority as an Enum,
// we will just assign standard 'Medium' visually or extend the backend if we could.
// For this frontend, we'll map all real backend tasks to a priority visually.

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [activeTab, setActiveTab] = useState<'tasks' | 'architecture'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('engineer@company.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [authError, setAuthError] = useState('');

  // Modal State
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  // Toasts State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Real backend loader
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await tasksService.getTasks();
      // Sort tasks: pending first, then by creation date descending
      const sorted = data.sort((a, b) => {
        if (a.is_completed === b.is_completed) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.is_completed ? 1 : -1;
      });
      setTasks(sorted);
    } catch (err: any) {
      showToast('Failed to load tasks. Backend unreachable?', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Handle token expiration / 401s
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      showToast('Session expired. Please sign in again.', 'error');
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);

    if (isAuthenticated) {
      loadTasks();
    }

    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [isAuthenticated]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      // First try to login
      const { access_token } = await authService.login(loginEmail, loginPassword);
      localStorage.setItem('access_token', access_token);
      setIsAuthenticated(true);
      showToast('Authentication successful. Welcome.');
    } catch (err: any) {
      // If unauthorized, could mean user doesn't exist. Try to auto-register for the demo.
      if (err.response?.status === 401) {
        try {
          await authService.register(loginEmail, loginPassword);
          const { access_token } = await authService.login(loginEmail, loginPassword);
          localStorage.setItem('access_token', access_token);
          setIsAuthenticated(true);
          showToast('Account automatically created and authenticated.');
        } catch (regErr) {
          setAuthError('Authentication failed. Check credentials.');
          showToast('Authentication failed.', 'error');
        }
      } else {
        setAuthError('Backend API unreachable. Ensure backend is running.');
        showToast('System connection error.', 'error');
      }
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    
    try {
      const created = await tasksService.createTask({
        title: newTask.title,
        description: newTask.description || undefined
      });
      setTasks([created, ...tasks]);
      setIsAdding(false);
      setNewTask({ title: '', description: '' });
      showToast('Task successfully created in database.');
    } catch (err) {
      showToast('Failed to create task.', 'error');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await tasksService.deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
      showToast('Task removed from system.', 'info');
    } catch (err) {
      showToast('Failed to delete task.', 'error');
    }
  };

  const handleToggleTask = async (id: number, currentCompleted: boolean) => {
    // Optimistic UI update
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, is_completed: !currentCompleted } : t
    ));
    
    try {
      await tasksService.updateTask(id, { is_completed: !currentCompleted });
      if (!currentCompleted) showToast('Task marked as completed.');
    } catch (err) {
      // Revert optimistic update on failure
      setTasks(tasks.map(t => 
        t.id === id ? { ...t, is_completed: currentCompleted } : t
      ));
      showToast('Failed to update task status.', 'error');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setTasks([]);
    showToast('Session terminated cleanly.', 'info');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  // ----------------------------------------------------
  // LOGIN SCREEN
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-200">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center text-blue-500">
            <LayoutDashboard size={48} strokeWidth={1.5} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
            TaskCore API
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Engineering Platform & Task Management System
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-[#111827] py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-slate-800">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-slate-300">Email address</label>
                <div className="mt-1">
                  <input 
                    type="email" 
                    required 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-slate-200 placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors" 
                    placeholder="engineer@company.com" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <div className="mt-1">
                  <input 
                    type="password" 
                    required 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-slate-200 placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors" 
                  />
                </div>
              </div>
              
              {authError && (
                <div className="text-red-400 text-sm font-medium bg-red-400/10 border border-red-400/20 p-2 rounded-md">
                  {authError}
                </div>
              )}

              <div>
                <button type="submit" className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#111827] transition-all">
                  Authenticate Session
                </button>
              </div>
            </form>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
               <Lock size={12} /> SSL/TLS Secure Connection
            </div>
            
            <div className="mt-4 p-3 bg-slate-800/40 rounded-md border border-slate-700/50 text-xs text-slate-400 text-center">
              System is configured for auto-registration on first login.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="flex h-screen bg-[#0B1120] text-slate-300 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-[#0F172A] border-r border-slate-800 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-lg tracking-tight">
            <LayoutDashboard size={22} className="text-blue-500" />
            <span className="text-slate-100">TaskCore</span><span className="font-light text-blue-500">PRO</span>
          </div>
        </div>
        
        <div className="flex-1 py-6">
          <div className="px-3">
             <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">System Views</div>
          </div>
          <nav className="px-3 space-y-1">
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'tasks' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <ListTodo className={`${activeTab === 'tasks' ? 'text-blue-400' : 'text-slate-500'} mr-3 flex-shrink-0 h-5 w-5`} />
              Active Tasks
            </button>
            <button 
              onClick={() => setActiveTab('architecture')}
              className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'architecture' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <Layers className={`${activeTab === 'architecture' ? 'text-blue-400' : 'text-slate-500'} mr-3 flex-shrink-0 h-5 w-5`} />
              Architecture
            </button>
          </nav>

          <div className="px-3 mt-8">
             <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">Environment</div>
             <div className="px-3 py-2 text-xs flex items-center gap-2 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> API: Connected
             </div>
             <div className="px-3 py-2 text-xs flex items-center gap-2 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> DB: SQLAlchemy Sync
             </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout} 
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-400 rounded-md hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-500" />
            Terminate Session
          </button>
        </div>
      </div>

      {/* HEADER & MAIN */}
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
        <header className="h-16 bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex flex-1">
            <div className="w-full max-w-md flex items-center relative group">
              <Search className="absolute left-3 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-800 bg-[#0F172A] rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-slate-200 placeholder-slate-500 transition-all outline-none" 
              />
            </div>
          </div>
          <div className="ml-4 flex items-center gap-4">
            <div className="text-xs text-slate-500 hidden sm:block">
               {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
             </div>
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-medium">
              <User size={16} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-5xl mx-auto">
            
            {/* TASKS VIEW */}
            {activeTab === 'tasks' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100">Tasks Dashboard</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage your development and operational tasks.</p>
                  </div>
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-md text-sm font-medium shadow-sm hover:bg-blue-500 transition-colors"
                  >
                    <PlusCircle size={18} />
                    New Task
                  </button>
                </div>

                {isLoading && tasks.length === 0 ? (
                  <div className="mt-8 flex justify-center p-12">
                     <Activity size={24} className="text-blue-500 animate-pulse" />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="mt-8 bg-[#0F172A] rounded-lg border border-slate-800/60 border-dashed p-12 text-center flex flex-col items-center">
                     <div className="h-12 w-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                        <CheckSquare className="text-slate-500 h-6 w-6" />
                     </div>
                     <h3 className="text-slate-200 font-medium text-lg">No active tasks</h3>
                     <p className="text-slate-400 mt-1 text-sm max-w-sm">Create your first task to get started.</p>
                     <button onClick={() => setIsAdding(true)} className="mt-6 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                        + Create Task
                     </button>
                  </div>
                ) : (
                  <div className="bg-[#0F172A] shadow-sm ring-1 ring-slate-800 sm:rounded-lg overflow-hidden">
                    <ul role="list" className="divide-y divide-slate-800/60">
                      {tasks.map((task) => (
                        <li key={task.id} className="p-4 sm:p-5 hover:bg-[#131C31] transition-all group duration-200">
                          <div className="flex items-start justify-between gap-4">
                            
                            {/* Checkbox & Content */}
                            <div className="flex items-start gap-4 flex-1">
                              <button 
                                onClick={() => handleToggleTask(task.id, task.is_completed)}
                                className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                                  task.is_completed 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : 'border-slate-600 text-transparent hover:border-blue-500'
                                }`}
                              >
                                <CheckSquare size={14} className={task.is_completed ? 'opacity-100' : 'opacity-0'} />
                              </button>
                              
                              <div className="flex flex-col gap-1 w-full">
                                <span className={`text-sm font-medium leading-tight transition-colors ${task.is_completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                  {task.title}
                                </span>
                                {task.description && (
                                  <p className={`text-xs ${task.is_completed ? 'text-slate-600' : 'text-slate-400'} line-clamp-2 mt-0.5 whitespace-pre-wrap`}>
                                    {task.description}
                                  </p>
                                )}
                                
                                {/* Metadata Row */}
                                <div className="flex items-center gap-3 mt-2">
                                  <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset bg-slate-500/10 text-slate-400 ring-slate-500/20`}>
                                    ID: {task.id}
                                  </span>
                                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                                    <Clock size={10} />
                                    {formatDate(task.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center flex-shrink-0">
                               <button 
                                 onClick={() => handleDeleteTask(task.id)}
                                 className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md hover:bg-red-400/10 cursor-pointer"
                                 title="Delete Resource"
                                 aria-label="Delete Task"
                               >
                                 <Trash2 size={16} />
                               </button>
                            </div>

                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ARCHITECTURE VIEW */}
            {activeTab === 'architecture' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-100">System Architecture</h1>
                  <p className="text-sm text-slate-400 mt-1">Backend topology, auth flow, and database models.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   
                   {/* Auth Flow */}
                   <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4 text-slate-200">
                        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-md ring-1 ring-purple-500/20">
                          <Lock size={18} />
                        </div>
                        <h3 className="font-medium text-lg">Authentication Flow</h3>
                      </div>
                      <div className="space-y-3 text-sm text-slate-400 font-mono">
                         <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                           <span>1. POST /api/v1/login</span>
                           <span className="text-emerald-400">OAuth2Form</span>
                         </div>
                         <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                           <span>2. Verify Passlib[bcrypt]</span>
                           <span className="text-slate-500">Hash Match</span>
                         </div>
                         <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                           <span>3. PyJWT Encode</span>
                           <span className="text-blue-400">HS256 Header</span>
                         </div>
                         <div className="flex items-center justify-between pt-1 text-slate-500">
                           <span>4. Dependency Injection</span>
                           <span>Depends(get_current_user)</span>
                         </div>
                      </div>
                   </div>

                   {/* Database Schema */}
                   <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4 text-slate-200">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-md ring-1 ring-blue-500/20">
                          <Database size={18} />
                        </div>
                        <h3 className="font-medium text-lg">Database Topology</h3>
                      </div>
                      <div className="space-y-4 text-sm font-mono bg-[#0B1120] p-4 rounded-md border border-slate-800/80 text-slate-300">
                         <div>
                           <span className="text-pink-400">User</span> {'{'}
                           <div className="pl-4 text-slate-500">id: Integer (PK)</div>
                           <div className="pl-4 text-slate-500">email: String (Unique)</div>
                           <div className="pl-4 text-slate-500">hashed_password: String</div>
                           {'}'}
                         </div>
                         <div>
                           <span className="text-blue-400">Task</span> {'{'}
                           <div className="pl-4 text-slate-500">id: Integer (PK)</div>
                           <div className="pl-4 text-slate-500">owner_id: FK(users.id)</div>
                           <div className="pl-4 text-slate-500">is_completed: Boolean</div>
                           {'}'}
                         </div>
                      </div>
                   </div>

                   {/* Deployment Pipeline */}
                   <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-6 md:col-span-2">
                      <div className="flex items-center gap-3 mb-4 text-slate-200">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-md ring-1 ring-emerald-500/20">
                          <Server size={18} />
                        </div>
                        <h3 className="font-medium text-lg">Deployment Pipeline</h3>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium text-slate-400 p-6">
                         <div className="bg-[#0B1120] border border-slate-800 px-6 py-4 rounded-lg flex flex-col items-center gap-2">
                            <span className="text-blue-400 font-mono">React + Vite</span>
                            <span className="text-xs text-slate-500">Frontend (Vercel)</span>
                         </div>
                         <div className="h-8 w-px sm:h-px sm:w-16 bg-slate-700 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 bg-[#0F172A]">
                               <Activity size={14} className="text-slate-500" />
                            </div>
                         </div>
                         <div className="bg-[#0B1120] border border-slate-800 px-6 py-4 rounded-lg flex flex-col items-center gap-2 ring-1 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                            <span className="text-emerald-400 font-mono">FastAPI</span>
                            <span className="text-xs text-slate-500">Backend API (Render)</span>
                         </div>
                         <div className="h-8 w-px sm:h-px sm:w-16 bg-slate-700"></div>
                         <div className="bg-[#0B1120] border border-slate-800 px-6 py-4 rounded-lg flex flex-col items-center gap-2">
                            <span className="text-indigo-400 font-mono">SQLite / Postgres</span>
                            <span className="text-xs text-slate-500">Database Engine</span>
                         </div>
                      </div>
                   </div>
                   
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ---------------------------------------------------- */}
      {/* ADD TASK MODAL OVERLAY */}
      {/* ---------------------------------------------------- */}
      {isAdding && (
         <div className="fixed inset-0 bg-[#0B1120]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-[#0F172A] rounded-xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/20">
                  <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
                    <Database size={18} className="text-blue-500" />
                    Create New Task
                  </h3>
                  <button 
                    onClick={() => setIsAdding(false)} 
                    className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                  >
                    <X size={20} />
                  </button>
               </div>
               
               <form onSubmit={handleAddTask} className="p-5 space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-300 mb-1">Task Title</label>
                     <input 
                       type="text" 
                       required 
                       autoFocus
                       value={newTask.title}
                       onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                       className="w-full bg-[#0B1120] border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-600 sm:text-sm"
                       placeholder="e.g. Update Dockerfile"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-300 mb-1">Description <span className="text-slate-600 font-normal">(Optional)</span></label>
                     <textarea 
                       value={newTask.description}
                       onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                       rows={3}
                       className="w-full bg-[#0B1120] border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-600 sm:text-sm resize-none"
                       placeholder="Add more details..."
                     />
                  </div>
                  
                  <div className="pt-4 mt-2 border-t border-slate-800 flex justify-end gap-3">
                     <button
                       type="button"
                       onClick={() => setIsAdding(false)}
                       className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                     >
                       Cancel
                     </button>
                     <button
                       type="submit"
                       className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md shadow focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0F172A] transition-all flex items-center gap-2 cursor-pointer"
                     >
                       <Server size={14} />
                       Save Task
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TOAST SYSTEM */}
      {/* ---------------------------------------------------- */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
           <div 
             key={toast.id} 
             className="bg-[#1E293B] border border-slate-700 shadow-xl rounded-md px-4 py-3 flex items-center gap-3 animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto min-w-[300px]"
           >
              {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
              {toast.type === 'info' && <Database size={16} className="text-blue-400" />}
              {toast.type === 'error' && <X size={16} className="text-red-400" />}
              <span className="text-sm font-medium text-slate-200">{toast.message}</span>
           </div>
        ))}
      </div>

    </div>
  );
}

