import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../core/state/AppContext';
import { useData } from '../core/state/DataContext';
import { Job, Vehicle, Customer, PurchaseOrder, VehicleStatus, User, JobSegment, Engineer } from '../types';
import { Clock, Edit, LogIn, Package as PackageIcon, PackageCheck, CheckCircle, ArrowRightCircle, Wrench, Search, X, Wand2, FileText, KeyRound, Car, Filter, Square, CheckSquare, LogOut, PlayCircle, PauseCircle, Play, ClipboardCheck, User as UserIcon } from 'lucide-react';
import { getCustomerDisplayName } from '../core/utils/customerUtils';
import { getRelativeDate, formatReadableDate } from '../core/utils/dateUtils';
import PauseReasonModal from './PauseReasonModal';
import { TIME_SEGMENTS, SEGMENT_DURATION_MINUTES, END_HOUR, END_MINUTE } from '../constants';

const getPoStatusColor = (status: PurchaseOrder['status'], type: 'bg' | 'text') => {
    const colors = {
        'Draft': { bg: 'bg-gray-200', text: 'text-gray-800' },
        'Ordered': { bg: 'bg-blue-200', text: 'text-blue-800' },
        'Partially Received': { bg: 'bg-amber-200', text: 'text-amber-800' },
        'Received': { bg: 'bg-green-200', text: 'text-green-800' },
        'Cancelled': { bg: 'bg-red-200', text: 'text-red-800' },
    };
    return colors[status]?.[type] || colors['Draft'][type];
};

// Reusable job card
const ConciergeJobCard: React.FC<{
    job: Job;
    vehicle?: Vehicle;
    customer?: Customer;
    purchaseOrders: PurchaseOrder[];
    engineers: Engineer[];
    currentUser: User;
    onEdit: (jobId: string) => void;
    onCheckIn: (jobId: string) => void;
    onOpenPurchaseOrder: (po: PurchaseOrder) => void;
    onOpenAssistant: (jobId: string) => void;
    onGenerateInvoice?: (jobId: string) => void;
    onCollect?: (jobId: string) => void;
    onQcApprove?: (jobId: string) => void;
    onStartWork?: (jobId: string, segmentId: string) => void;
    onPause?: (jobId: string, segmentId: string) => void;
    onRestart?: (jobId: string, segmentId: string) => void;
    onEngineerComplete?: (job: Job, segmentId: string) => void;
    highlightAction?: 'checkIn' | 'invoice' | 'collect';
}> = (props) => {
    const { job, vehicle, customer, purchaseOrders, engineers, currentUser, onEdit, onCheckIn, onOpenPurchaseOrder, onOpenAssistant, onGenerateInvoice, onCollect, onQcApprove, onStartWork, onPause, onRestart, onEngineerComplete, highlightAction } = props;
    
    const { partsStatus, vehicleStatus } = job;
    const today = getRelativeDate(0);
    const engineersById = useMemo(() => new Map(engineers.map(e => [e.id, e])), [engineers]);
    const segmentsToday = useMemo(() => (job.segments || []).filter(s => s.date === today && s.allocatedLift), [job.segments, today]);

    const partsStatusInfo = {
        'Awaiting Order': { title: 'Awaiting Parts Order', color: 'text-red-600', icon: PackageIcon },
        'Ordered': { title: 'Parts Ordered', color: 'text-blue-600', icon: PackageIcon },
        'Partially Received': { title: 'Parts Partially Received', color: 'text-amber-600', icon: PackageIcon },
        'Fully Received': { title: 'All Parts Received', color: 'text-purple-600', icon: PackageCheck },
    }[partsStatus || 'Not Required'];

    const vehicleStatusInfo: Record<VehicleStatus, { icon: React.ElementType, color: string, text: string }> = {
        'On Site': { icon: CheckCircle, color: 'text-green-600', text: 'On Site' },
        'Off-Site (Partner)': { icon: ArrowRightCircle, color: 'text-blue-600', text: 'Off-Site' },
        'Awaiting Arrival': { icon: Clock, color: 'text-gray-500', text: 'Awaiting Arrival' },
        'Awaiting Collection': { icon: Clock, color: 'text-purple-600', text: 'Awaiting Collection' },
        'Collected': { icon: CheckCircle, color: 'text-gray-500', text: 'Collected' },
    };
    const currentVehicleStatus = vehicleStatusInfo[vehicleStatus || 'Awaiting Arrival'];

    const getCardColorClasses = () => {
        if (highlightAction === 'collect') return 'bg-purple-50 border-purple-300';
        if (highlightAction === 'invoice') return 'bg-indigo-50 border-indigo-300';
        if (highlightAction === 'checkIn') return 'bg-blue-50 border-blue-300';
        
        switch (job.status) {
            case 'Unallocated': return 'bg-slate-100 border-slate-400';
            case 'Allocated': return 'bg-blue-50 border-blue-200';
            case 'In Progress': return 'bg-yellow-50 border-yellow-200';
            case 'Paused': return 'bg-red-50 border-red-200';
            case 'Pending QC': return 'bg-orange-50 border-orange-200';
            case 'Invoiced': return 'bg-green-50 border-green-200';
            default: return 'bg-white border-gray-200';
        }
    };
    
    const associatedPOs = (job.purchaseOrderIds || []).map(id => purchaseOrders.find(po => po.id === id)).filter(Boolean) as PurchaseOrder[];
    
    const canControl = (segment: JobSegment) => {
        if (!segment.engineerId) return false;
        if (currentUser.role === 'Engineer') return segment.engineerId === currentUser.engineerId;
        return currentUser.role === 'Admin' || currentUser.role === 'Dispatcher';
    };

    return (
        <div
            className={`p-2 rounded-lg shadow-sm border space-y-1.5 cursor-pointer hover:shadow-md transition-shadow ${getCardColorClasses()}`}
            onClick={() => onEdit(job.id)}
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-800 flex-grow text-xs flex items-center gap-1">
                    {job.description}
                </h4>
                <div className="flex flex-col items-end gap-0.5">
                    <span className="font-mono text-[9px] bg-gray-200 px-1 py-0.5 rounded text-gray-600">#{job.id}</span>
                    {job.keyNumber && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded border border-yellow-200">
                            <KeyRound size={8} /> {job.keyNumber}
                        </span>
                    )}
                </div>
            </div>
            
            {/* Details */}
            <div className="text-[10px] text-gray-600 space-y-0.5">
                <p className="flex items-center gap-1 font-medium"><Car size={10}/> {vehicle?.registration} - {vehicle?.make} {vehicle?.model}</p>
                <p title={getCustomerDisplayName(customer)} className="truncate">{getCustomerDisplayName(customer)}</p>
                <p>{job.estimatedHours} hours</p>
            </div>

            {/* Segments for Today */}
            {segmentsToday.length > 0 && (
                <div className="mt-1 pt-1 border-t text-[10px] space-y-0.5">
                    {segmentsToday.map(seg => {
                        let timeString = `${seg.duration} hrs`;
                        if (seg.scheduledStartSegment !== null) {
                            const startTime = TIME_SEGMENTS[seg.scheduledStartSegment];
                            const numSegments = seg.duration * (60 / SEGMENT_DURATION_MINUTES);
                            const endSegmentIndex = seg.scheduledStartSegment + numSegments;
                            const endTime = endSegmentIndex < TIME_SEGMENTS.length ? TIME_SEGMENTS[endSegmentIndex] : `${END_HOUR}:${END_MINUTE}`;
                            timeString = `${startTime} - ${endTime}`;
                        }
                        
                        const controlEnabled = canControl(seg);

                        return (
                            <div key={seg.segmentId} className={`p-1 rounded-md ${controlEnabled ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold truncate">{engineersById.get(seg.engineerId!)?.name} on {seg.allocatedLift}</span>
                                    <span className={`font-semibold ml-1 ${seg.status === 'Paused' ? 'text-orange-600 animate-pulse' : 'text-indigo-700'}`}>{seg.status === 'Paused' ? 'PAUSED' : timeString}</span>
                                </div>
                                {controlEnabled && (
                                    <div className="mt-1 flex items-center justify-end gap-1">
                                        {seg.status === 'Allocated' && onStartWork && <button onClick={(e) => { e.stopPropagation(); onStartWork(job.id, seg.segmentId); }} className="flex items-center gap-1 px-1.5 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"><PlayCircle size={12} /> Start</button>}
                                        {seg.status === 'Paused' && onRestart && <button onClick={(e) => { e.stopPropagation(); onRestart(job.id, seg.segmentId); }} className="flex items-center gap-1 px-1.5 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"><Play size={12}/> Restart</button>}
                                        {seg.status === 'In Progress' && onPause && <button onClick={(e) => { e.stopPropagation(); onPause(job.id, seg.segmentId); }} className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500 text-white rounded hover:bg-orange-600"><PauseCircle size={12}/> Pause</button>}
                                        {seg.status === 'In Progress' && onEngineerComplete && <button onClick={(e) => { e.stopPropagation(); onEngineerComplete(job, seg.segmentId); }} className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700"><CheckCircle size={12}/> Complete</button>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center pt-1 border-t mt-0.5">
                 <div className="flex items-center gap-1 text-[9px]">
                     {partsStatusInfo && <span title={partsStatusInfo.title} className={`flex items-center gap-0.5 font-semibold ${partsStatusInfo.color}`}>{partsStatusInfo.icon && <partsStatusInfo.icon size={10}/>} {partsStatus}</span>}
                    <span title={`Vehicle Status: ${currentVehicleStatus.text}`} className={`flex items-center gap-0.5 font-semibold ${currentVehicleStatus.color}`}>
                        <currentVehicleStatus.icon size={10}/> {currentVehicleStatus.text}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onOpenAssistant(job.id); }} className="p-0.5 text-blue-600 hover:bg-blue-100 rounded" title="Assistant"><Wand2 size={12} /></button>
                    {highlightAction === 'checkIn' && <button onClick={(e) => { e.stopPropagation(); onCheckIn(job.id); }} className="text-[10px] flex items-center gap-0.5 bg-blue-100 text-blue-800 px-1 py-0.5 rounded hover:bg-blue-200"><LogIn size={10} /> In</button>}
                    {job.status === 'Pending QC' && onQcApprove && (currentUser.role === 'Admin' || currentUser.role === 'Dispatcher') && <button onClick={(e) => {e.stopPropagation(); onQcApprove(job.id);}} className="text-[10px] flex items-center gap-0.5 bg-orange-100 text-orange-800 px-1 py-0.5 rounded hover:bg-orange-200"><ClipboardCheck size={10}/> QC</button>}
                    {highlightAction === 'invoice' && onGenerateInvoice && <button onClick={(e) => { e.stopPropagation(); onGenerateInvoice(job.id); }} className="text-[10px] flex items-center gap-0.5 bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded hover:bg-indigo-200"><FileText size={10} /> Inv</button>}
                    {highlightAction === 'collect' && onCollect && <button onClick={(e) => { e.stopPropagation(); onCollect(job.id); }} className="text-[10px] flex items-center gap-0.5 bg-green-100 text-green-800 px-1 py-0.5 rounded hover:bg-green-200"><LogOut size={10} /> Out</button>}
                </div>
            </div>
        </div>
    );
};


const KanbanColumn: React.FC<{ title: string; count: number; colorClass: string; children: React.ReactNode; }> = ({ title, count, colorClass, children }) => {
    return (
        <div className="flex-1 flex flex-col bg-gray-100 rounded-xl min-w-[160px] h-full max-h-full">
            <div className={`flex items-center justify-between p-1.5 border-b-4 ${colorClass} bg-white rounded-t-xl sticky top-0 z-10 shadow-sm`}>
                <h3 className="flex items-center gap-1.5 font-bold text-gray-700 text-xs">
                    {title} <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full border">{count}</span>
                </h3>
            </div>
            <div className="p-1.5 space-y-2 overflow-y-auto flex-grow custom-scrollbar">
                {children}
            </div>
        </div>
    );
};


interface ConciergeViewProps {
    onEditJob: (jobId: string) => void;
    onCheckIn: (jobId: string) => void;
    onOpenPurchaseOrder: (po: PurchaseOrder) => void;
    onOpenAssistant: (jobId: string) => void;
    onGenerateInvoice?: (jobId: string) => void;
    onCollect?: (jobId: string) => void;
    onQcApprove: (jobId: string) => void;
    onStartWork: (jobId: string, segmentId: string) => void;
    onEngineerComplete: (job: Job, segmentId: string) => void;
    onPause: (jobId: string, segmentId: string, reason: string) => void;
    onRestart: (jobId: string, segmentId: string) => void;
}

const ConciergeView: React.FC<ConciergeViewProps> = (props) => {
    const { jobs, customers, vehicles, purchaseOrders, invoices, engineers } = useData();
    const { selectedEntityId, currentUser } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [pauseData, setPauseData] = useState<{ jobId: string, segmentId: string } | null>(null);
    const [arrivalFilter, setArrivalFilter] = useState<'today' | '7days' | '14days'>('today');
    
    const vehiclesById = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);
    const customersById = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
    const invoicesById = useMemo(() => new Map(invoices.map(i => [i.id, i])), [invoices]);

    const filteredJobs = useMemo(() => {
        let relevantJobs = jobs.filter(job => (selectedEntityId === 'all' || job.entityId === selectedEntityId) && job.vehicleStatus !== 'Collected' && job.status !== 'Cancelled');
        
        // --- ENGINEER FILTERING LOGIC ---
        // If current user is an Engineer, only show jobs assigned to them
        if (currentUser.role === 'Engineer' && currentUser.engineerId) {
            relevantJobs = relevantJobs.filter(job => 
                (job.segments || []).some(segment => segment.engineerId === currentUser.engineerId)
            );
        }

        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            relevantJobs = relevantJobs.filter(job => {
                const vehicle = vehiclesById.get(job.vehicleId);
                const customer = customersById.get(job.customerId);
                return (
                    job.description.toLowerCase().includes(lowerSearch) ||
                    (vehicle && vehicle.registration.toLowerCase().replace(/\s/g, '').includes(lowerSearch.replace(/\s/g, ''))) ||
                    (customer && getCustomerDisplayName(customer).toLowerCase().includes(lowerSearch))
                );
            });
        }
        return relevantJobs.sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
    }, [jobs, selectedEntityId, searchTerm, vehiclesById, customersById, currentUser]);

    const { arrivals, allocated, inProgress, pendingQC, invoicing, handover } = useMemo(() => {
        const arrivals: Job[] = [];
        const allocated: Job[] = [];
        const inProgress: Job[] = [];
        const pendingQC: Job[] = [];
        const invoicing: Job[] = [];
        const handover: Job[] = [];
        const today = getRelativeDate(0);
        let filterEndDate = today;

        if (arrivalFilter === '7days') filterEndDate = getRelativeDate(6);
        if (arrivalFilter === '14days') filterEndDate = getRelativeDate(13);

        filteredJobs.forEach(job => {
            // 1. Arrivals
            if (job.vehicleStatus === 'Awaiting Arrival') {
                const isDue = (job.segments || []).some(s => s.date && s.date <= filterEndDate);
                if (isDue) {
                    arrivals.push(job);
                }
                return; 
            }

            // 2. Handover (Ready for Collection) - PRIORITIZED
            if (job.vehicleStatus === 'Awaiting Collection' || (job.vehicleStatus === 'On Site' && job.invoiceId)) {
                handover.push(job);
                return;
            }

            // 3. Pending QC
            if (job.status === 'Pending QC') {
                pendingQC.push(job);
                return;
            }

            // 4. Invoicing (Complete but no invoice yet)
            if (job.status === 'Complete' && !job.invoiceId) {
                invoicing.push(job);
                return;
            }

            // 5. In Progress
            if (job.status === 'In Progress' || (job.segments || []).some(s => s.status === 'Paused')) {
                inProgress.push(job);
                return;
            }

            // 6. Allocated / Unallocated
            if (job.status === 'Allocated' || job.status === 'Unallocated') {
                allocated.push(job);
                return;
            }
        });
        
        return { arrivals, allocated, inProgress, pendingQC, invoicing, handover }; 
    }, [filteredJobs, invoicesById, arrivalFilter]);

    const handlePauseClick = (jobId: string, segmentId: string) => {
        setPauseData({ jobId, segmentId });
    };

    const handleConfirmPause = (reason: string) => {
        if (pauseData) {
            props.onPause(pauseData.jobId, pauseData.segmentId, reason);
            setPauseData(null);
        }
    };
    
    const renderJobCard = (job: Job, highlight?: 'checkIn' | 'invoice' | 'collect') => (
        <ConciergeJobCard
            key={job.id}
            job={job}
            vehicle={vehiclesById.get(job.vehicleId)}
            customer={customersById.get(job.customerId)}
            purchaseOrders={purchaseOrders}
            engineers={engineers}
            currentUser={currentUser}
            {...props}
            onPause={handlePauseClick}
            onEdit={props.onEditJob}
            highlightAction={highlight}
        />
    );

    const arrivalsTitle = useMemo(() => {
        if (arrivalFilter === 'today') return "Due Today / Arrivals";
        if (arrivalFilter === '7days') return "Due 7 Days / Arrivals";
        return "Due 14 Days / Arrivals";
    }, [arrivalFilter]);

    return (
        <div className="w-full h-full flex flex-col p-4 bg-gray-50">
            <header className="flex justify-between items-center mb-3 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-800">
                    {currentUser.role === 'Engineer' ? 'My Job Stream' : 'Service Stream'}
                </h2>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-200 rounded-lg p-1">
                        {(['today', '7days', '14days'] as const).map(opt => (
                            <button
                                key={opt}
                                onClick={() => setArrivalFilter(opt)}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${arrivalFilter === opt ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                {opt === 'today' ? 'Today' : opt === '7days' ? '7 Days' : '14 Days'}
                            </button>
                        ))}
                    </div>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                        <input 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search by reg, customer..."
                            className="w-64 p-1.5 pl-9 border rounded-lg text-sm"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={16}/>
                            </button>
                        )}
                    </div>
                </div>
            </header>
            
            <main className="flex-grow overflow-x-auto pb-2">
                <div className="flex gap-3 h-full min-w-full">
                    <KanbanColumn title={arrivalsTitle} count={arrivals.length} colorClass="border-blue-400">
                        {arrivals.length > 0 ? arrivals.map(j => renderJobCard(j, 'checkIn')) : <p className="text-center text-gray-400 py-4 text-xs">No pending arrivals.</p>}
                    </KanbanColumn>
                    <KanbanColumn title="Allocated / Unallocated" count={allocated.length} colorClass="border-cyan-400">
                        {allocated.map(j => renderJobCard(j))}
                    </KanbanColumn>
                    <KanbanColumn title="In Progress" count={inProgress.length} colorClass="border-yellow-400">
                        {inProgress.map(j => renderJobCard(j))}
                    </KanbanColumn>
                     <KanbanColumn title="Pending QC" count={pendingQC.length} colorClass="border-orange-400">
                        {pendingQC.map(j => renderJobCard(j))}
                    </KanbanColumn>
                    <KanbanColumn title="Ready to Invoice" count={invoicing.length} colorClass="border-indigo-500">
                         {invoicing.length > 0 ? invoicing.map(j => renderJobCard(j, 'invoice')) : <p className="text-center text-gray-400 py-4 text-xs">No jobs awaiting invoice.</p>}
                    </KanbanColumn>
                    <KanbanColumn title="Ready for Collection" count={handover.length} colorClass="border-green-500">
                         {handover.length > 0 ? handover.map(j => renderJobCard(j, 'collect')) : <p className="text-center text-gray-400 py-4 text-xs">No vehicles ready for collection.</p>}
                    </KanbanColumn>
                </div>
            </main>
            {pauseData && (
                <PauseReasonModal
                    isOpen={!!pauseData}
                    onClose={() => setPauseData(null)}
                    onConfirm={handleConfirmPause}
                />
            )}
        </div>
    );
};
export default ConciergeView;