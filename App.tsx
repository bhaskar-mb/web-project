
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ReportWizard from './components/ReportWizard';
import Login from './components/Login';
import SystemInsights from './components/SystemInsights';
import Resources from './components/Resources';
import { User, Report, Severity, IncidentType, ReportStatus, TimelineEvent } from './types';

const AUTHORITIES = ["Forestry Commission", "Wildlife Rescue Unit", "EPA Response Team", "Municipal Parks Dept"];
const FIELD_ACTIONS = ["Medical Intervention", "Habitat Restoration", "Illegal Site Shutdown", "Wildlife Relocation", "Public Warning Issue"];

const INITIAL_REPORTS: Report[] = [
  {
    id: 'R-102',
    type: IncidentType.ILLEGAL_LOGGING,
    severity: Severity.HIGH,
    description: 'Unauthorized logging machinery detected in Sector 42 Protected Zone.',
    location: { lat: 45.523, lng: -122.676, address: "Sector 42, Northern Ridge" },
    timestamp: new Date(Date.now() - 3600000),
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
    status: 'assigned',
    reporterId: 'user-001',
    assignedAuthorityId: 'Forestry Commission',
    aiInsights: 'Vision analysis confirms industrial-grade equipment and fresh timber removal.',
    timeline: [
      { status: 'pending', timestamp: new Date(Date.now() - 3600000), message: 'Incident reported by Sentinel.', actor: 'John Sentinel' },
      { status: 'assigned', timestamp: new Date(Date.now() - 2400000), message: 'Admin forwarded case to Forestry Commission.', actor: 'Chief Warden' }
    ]
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
    setShowWelcome(true);
    setTimeout(() => setShowWelcome(false), 5000);
  };

  const handleUpdateStatus = (id: string, newStatus: ReportStatus, message: string, actor: string, extraData?: any) => {
    setReports(prev => prev.map(r => {
      if (r.id === id) {
        const newEvent: TimelineEvent = { 
          status: newStatus, 
          timestamp: new Date(), 
          message, 
          actor, 
          actionTaken: extraData?.actionTaken 
        };
        return { 
          ...r, 
          status: newStatus, 
          timeline: [...r.timeline, newEvent], 
          ...extraData 
        };
      }
      return r;
    }));
  };

  if (!isAuthenticated) return <Login onLoginSuccess={handleAuthSuccess} />;

  // Filter reports for the Agency UI - strictly assigned to THEIR organization
  const visibleReports = user?.role === 'authority' 
    ? reports.filter(r => r.assignedAuthorityId === user.organization)
    : (user?.role === 'user' ? reports.filter(r => r.reporterId === user.id) : reports);

  const orgName = user?.organization || 'Unassigned Agency';

  return (
    <Layout user={user!} onLogout={() => setIsAuthenticated(false)} activeTab={activeTab} setActiveTab={setActiveTab}>
      {showWelcome && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-4 duration-500">
           <div className="bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-xl">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                user?.role === 'admin' ? 'bg-indigo-500' : user?.role === 'authority' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}>
                 <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{user?.role} ACCESS GRANTED</p>
                <p className="text-sm font-bold">{user?.name}</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'dashboard' && <Dashboard reports={reports} user={user!} onNewReport={() => setActiveTab('report')} onNavigate={(t) => setActiveTab(t)} />}
      
      {activeTab === 'report' && <ReportWizard onComplete={(data) => {
        const nr: Report = { 
          ...data, 
          id: `R-${Math.floor(Math.random()*900)+100}`, 
          status: 'pending', 
          reporterId: user!.id, 
          timeline: [{ status: 'pending', timestamp: new Date(), message: 'Incident reported and awaiting Admin assignment.', actor: user!.name }] 
        } as Report;
        setReports([nr, ...reports]);
        setActiveTab('reports');
      }} />}

      {activeTab === 'reports' && (
        <div className="space-y-12">
          {/* Header UI changes based on Role */}
          <div className={`p-10 rounded-[3rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 ${
            user?.role === 'admin' ? 'bg-indigo-50/50 border-indigo-100' : 
            user?.role === 'authority' ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100'
          }`}>
             <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  {user?.role === 'admin' ? 'Incident Dispatch Center' : 
                   user?.role === 'authority' ? 'Agency Task Board' : 'Your Reports Feed'}
                </h2>
                <p className="text-slate-500 font-medium">
                  {user?.role === 'admin' ? 'Dispatching tasks to specialized agencies.' : 
                   user?.role === 'authority' ? `Tasks assigned to ${orgName}.` : 'Tracking your contribution to the planet.'}
                </p>
             </div>
             <div className="flex bg-white/50 p-1.5 rounded-2xl border border-slate-200">
                <span className="px-6 py-2.5 bg-white shadow-sm rounded-xl text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">
                  {user?.role} SECURE SESSION
                </span>
             </div>
          </div>

          <div className="grid gap-12">
            {visibleReports.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                 <p className="font-black text-slate-400 uppercase tracking-widest">No active reports in this view.</p>
                 {user?.role === 'authority' && (
                   <p className="text-xs text-slate-400 mt-2 italic">Waiting for Admin to forward new cases to {orgName}.</p>
                 )}
              </div>
            )}
            {visibleReports.map(r => (
              <div key={r.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col xl:flex-row transition-all hover:shadow-emerald-900/10">
                 <div className="xl:w-1/3 h-64 xl:h-auto relative">
                    <img src={r.imageUrl} className="w-full h-full object-cover" alt="Evidence" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-8">
                       <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white ${
                         r.severity === Severity.CRITICAL ? 'bg-red-500' : 'bg-emerald-500'
                       }`}>{r.type}</span>
                       <h3 className="text-white text-xl font-black mt-2">{r.location.address}</h3>
                    </div>
                 </div>

                 <div className="xl:w-2/3 p-10 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full animate-pulse ${
                            r.status === 'resolved' ? 'bg-emerald-500' : 
                            r.status === 'solved_by_authority' ? 'bg-blue-500' : 'bg-amber-500'
                          }`} />
                          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">OPERATIONAL STATUS: <span className="text-slate-900">
                            {r.status === 'solved_by_authority' ? 'Intimation Sent (Review)' : r.status.replace('_', ' ')}
                          </span></p>
                       </div>
                       {r.assignedAuthorityId && (
                         <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100">
                            {r.assignedAuthorityId}
                         </div>
                       )}
                    </div>

                    <p className="text-lg font-bold text-slate-700 mb-8 leading-relaxed italic">"{r.description}"</p>

                    {/* ACTION PANELS */}
                    <div className="mb-8">
                      {/* ADMIN UI */}
                      {user?.role === 'admin' && (
                        <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-[2.5rem]">
                           <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-black">1</div>
                              <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Admin Command Panel</h4>
                           </div>

                           {r.status === 'pending' && (
                             <div className="space-y-4">
                               <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest pl-2">Task Assignment: Select Agency</p>
                               <div className="flex flex-wrap gap-2">
                                 {AUTHORITIES.map(auth => (
                                   <button 
                                     key={auth} 
                                     onClick={() => handleUpdateStatus(r.id, 'assigned', `Admin reviewed and forwarded report to ${auth}.`, 'Chief Warden', { assignedAuthorityId: auth })}
                                     className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                   >
                                     Forward to {auth}
                                   </button>
                                 ))}
                               </div>
                             </div>
                           )}
                           
                           {r.status === 'solved_by_authority' && (
                             <div className="space-y-4">
                               <div className="p-4 bg-white rounded-2xl border border-indigo-100">
                                 <p className="text-xs font-bold text-slate-600 italic">"The agency has intimated they have solved the issue. Please verify and notify the reporting user."</p>
                               </div>
                               <div className="flex gap-3">
                                  <button 
                                    onClick={() => handleUpdateStatus(r.id, 'resolved', 'Admin verified the fix. Issue solved and user notified.', 'Chief Warden')}
                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs hover:bg-emerald-700 shadow-xl transition-all"
                                  >
                                    Notify User: Issue Solved
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateStatus(r.id, 'investigating', 'Admin rejected intimation. Requested further action from Agency.', 'Chief Warden')}
                                    className="px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-xs hover:bg-red-700 transition-all"
                                  >
                                    Reject: Not Solved
                                  </button>
                               </div>
                             </div>
                           )}

                           {r.status === 'assigned' && <p className="text-[10px] font-black text-amber-600 pl-2">Waiting for {r.assignedAuthorityId} to complete task and intimate status...</p>}
                           {r.status === 'resolved' && <p className="text-[10px] font-black text-emerald-600 pl-2 uppercase tracking-widest">Incident Cycle Complete.</p>}
                        </div>
                      )}

                      {/* AGENCY UI */}
                      {user?.role === 'authority' && r.assignedAuthorityId === user.organization && (
                        <div className="bg-amber-50/50 border border-amber-100 p-8 rounded-[2.5rem]">
                           <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-amber-600 rounded-xl flex items-center justify-center text-white text-xs font-black">2</div>
                              <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Agency Action Panel</h4>
                           </div>

                           {r.status === 'assigned' && (
                             <div className="space-y-4">
                               <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest pl-2">Execution Control: Intimate Status to Admin</p>
                               <div className="flex flex-wrap gap-2">
                                 {FIELD_ACTIONS.map(act => (
                                   <button 
                                     key={act} 
                                     onClick={() => handleUpdateStatus(r.id, 'solved_by_authority', `Agency performed ${act}. Intimated Admin of completion.`, user.organization || 'Agency', { actionTaken: act })}
                                     className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                                   >
                                     {act} & Notify Admin
                                   </button>
                                 ))}
                               </div>
                             </div>
                           )}

                           {r.status === 'solved_by_authority' && (
                             <div className="flex items-center gap-3 text-indigo-600">
                               <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/></svg>
                               <p className="text-[10px] font-black uppercase tracking-widest">Intimation Sent. Awaiting Admin Verification.</p>
                             </div>
                           )}

                           {r.status === 'resolved' && <p className="text-[10px] font-black text-emerald-600 pl-2 uppercase tracking-widest">Assignment Resolved.</p>}
                        </div>
                      )}

                      {/* USER UI */}
                      {user?.role === 'user' && (
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Incident Monitoring Feedback</p>
                           <div className="flex items-start gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                               r.status === 'resolved' ? 'bg-emerald-500' : 'bg-slate-200'
                             }`}>
                               {r.status === 'resolved' ? (
                                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5"/></svg>
                               ) : (
                                 <svg className="w-6 h-6 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2.5"/></svg>
                               )}
                             </div>
                             <div>
                               <p className="text-sm font-bold text-slate-700">
                                 {r.status === 'pending' && "Command is reviewing your report..."}
                                 {r.status === 'assigned' && `Incident forwarded to ${r.assignedAuthorityId}. Investigation ongoing.`}
                                 {r.status === 'solved_by_authority' && "Agency has performed action. Admin is validating final solution."}
                                 {r.status === 'resolved' && "SUCCESS: The issue has been officially solved by the local authorities. Thank you!"}
                               </p>
                               <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">Updated: {new Date().toLocaleTimeString()}</p>
                             </div>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline Log */}
                    <div className="space-y-4">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Timeline Log</h4>
                      <div className="relative pl-6 space-y-4">
                         <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-slate-100" />
                         {r.timeline.map((evt, idx) => (
                           <div key={idx} className="relative">
                              <div className={`absolute -left-[1.375rem] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${idx === r.timeline.length-1 ? (evt.status === 'resolved' ? 'bg-emerald-500' : 'bg-indigo-500') : 'bg-slate-200'}`} />
                              <div className="flex justify-between items-start">
                                 <div>
                                    <p className="text-xs font-black text-slate-800">{evt.message}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Originator: {evt.actor}</p>
                                 </div>
                                 <span className="text-[8px] font-bold text-slate-300">{new Date(evt.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notes' && <Resources />}
      {activeTab === 'leaderboard' && <SystemInsights />}
    </Layout>
  );
};

export default App;
