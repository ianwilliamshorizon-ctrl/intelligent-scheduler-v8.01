import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useApp } from '../../core/state/AppContext';
import { useData } from '../../core/state/DataContext';
import { ChevronLeft, ChevronRight, Gauge, Clock, Edit, UserCog, KeyRound, PauseCircle, PlayCircle, PlusCircle, Wand2, Package as PackageIcon, PackageCheck, CheckCircle, ArrowRightCircle, LogIn, Trash2, Wrench } from 'lucide-react';
import { DraggedSegmentData, Job, JobSegment, Vehicle, Customer, Engineer, PurchaseOrder, Lift, User, UnbillableTimeEvent, VehicleStatus } from '../../types';
import { formatDate, dateStringToDate, getRelativeDate, formatReadableDate, addDays, getNextWorkingDay, getStartOfWeek } from '../../core/utils/dateUtils';
import { getCustomerDisplayName } from '../../core/utils/customerUtils';
import { calculateJobStatus } from '../../core/utils/jobUtils';
import { TIME_SEGMENTS, CAPACITY_THRESHOLD_WARNING, SEGMENT_DURATION_MINUTES, END_HOUR, END_MINUTE } from '../../constants';
import DatePickerModal from '../../components/DatePickerModal';
import { BookingCalendarView } from '../../components/BookingCalendarView';
import AssignEngineerModal from '../../components/AssignEngineerModal';
import PauseReasonModal from '../../components/PauseReasonModal';

// --- HELPER COMPONENTS ---

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

const getCapacityInfo = (totalHours: number, maxHours: number) => {
    if (maxHours <= 0) return { status: 'Normal', classes: 'bg-gray-100 text-gray-800' };
    const loadPercentage = totalHours / maxHours;
    if (totalHours > maxHours) {
        return { status: 'OVERLOADED', classes: 'bg-red-100 text-red-800 font-bold' };
    }
    if (loadPercentage >= CAPACITY_THRESHOLD_WARNING) {
        return { status: 'High Load', classes: 'bg-amber-100 text-amber-800' };
    }
    return { status: 'Normal', classes: 'bg-green-100 text-green-800' };
};

const DraggableJobCard: React.FC<{
    job: Job;
    vehicle?: Vehicle;
    customer?: Customer;
    purchaseOrders: PurchaseOrder[];
    onDragStart: (e: React.DragEvent<HTMLDivElement>, parentJobId: string, segmentId: string) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    onEdit: (jobId: string) => void;
    onCheckIn: (jobId: string) => void;
    onOpenPurchaseOrder: (po: PurchaseOrder) => void;
    currentUser: User;
    onOpenAssistant: (jobId: string) => void;
}> = ({ job, vehicle, customer, purchaseOrders, onDragStart, onDragEnd, onEdit, onCheckIn, onOpenPurchaseOrder, currentUser, onOpenAssistant }) => {
    const unallocatedSegments = (job.segments || []).filter(s => s.status === 'Unallocated');

    if (unallocatedSegments.length === 0) return null;
    
    const canDrag = currentUser.role === 'Admin' || currentUser.role === 'Dispatcher';

    const segmentToDrag = unallocatedSegments[0];
    
    const { partsStatus, vehicleStatus } = job;

    const partsStatusInfo = {
        'Awaiting Order': { title: 'Awaiting Parts Order', color: 'text-red-600', icon: PackageIcon },
        'Ordered': { title: 'Parts Ordered', color: 'text-blue-600', icon: PackageIcon },
        'Partially Received': { title: 'Parts Partially Received', color: 'text-amber-600', icon: PackageIcon },
        'Fully Received': { title: 'All Parts Received', color: 'text-purple-600', icon: PackageCheck },
        'Not Required': { title: 'Parts Not Required', color: 'text-purple-600', icon: CheckCircle }, // Use purple to signify readiness state consistent with 'Fully Received'
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
        const isVehicleOnSite = job.vehicleStatus === 'On Site';
        const arePartsReady = job.partsStatus === 'Fully Received' || job.partsStatus === 'Not Required';
        const isReadyForWorkshop = isVehicleOnSite && arePartsReady;
        
        if (isReadyForWorkshop) {
            return 'bg-green-100 border-green-300'; // Ready for workshop (Green)
        }
        
        switch (job.partsStatus) {
            case 'Awaiting Order': return 'bg-red-50 border-red-200';
            case 'Ordered': return 'bg-blue-50 border-blue-200';
            case 'Partially Received': return 'bg-amber-50 border-amber-200';
            case 'Fully Received': return 'bg-purple-100 border-purple-300'; // Parts here, waiting for car
            case 'Not Required': return 'bg-purple-100 border-purple-300'; // Treat same as parts received (Purple until car arrives)
            default: return 'bg-white border-gray-200';
        }
    };
    
    const associatedPOs = (job.purchaseOrderIds || []).map(id => purchaseOrders.find(po => po.id === id)).filter(Boolean) as PurchaseOrder[];
    
    const isReadyForWorkshop = job.vehicleStatus === 'On Site' && (job.partsStatus === 'Fully Received' || job.partsStatus === 'Not Required');
    
    return (
        <div
            draggable={canDrag}
            onDragStart={(e) => canDrag && onDragStart(e, job.id, segmentToDrag.segmentId)}
            onDragEnd={onDragEnd}
            className={`p-2.5 rounded-lg shadow-md border space-y-2 ${canDrag ? 'cursor-grab' : 'cursor-default'} draggable-job ${getCardColorClasses()}`}
            title={canDrag ? `Drag to schedule: ${job.description} (${segmentToDrag.duration}h)`: 'View job details'}
        >
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-gray-800 flex-grow flex items-center gap-2">
                    {isReadyForWorkshop && <span title="Ready for Workshop"><Wrench size={16} className="text-green-600" /></span>}
                    {job.description}
                </h4>
                <span className="font-mono text-xs bg-gray-200 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">#{job.id}</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Vehicle:</strong> {vehicle?.registration} - {vehicle?.make} {vehicle?.model}</p>
                <p><strong>Customer:</strong> {getCustomerDisplayName(customer)} ({customer?.mobile || customer?.phone})</p>
                <p><strong>Job Length:</strong> {job.estimatedHours} hours ({unallocatedSegments.length} segment{unallocatedSegments.length > 1 ? 's' : ''})</p>
            </div>

            {associatedPOs && associatedPOs.length > 0 && (
                <div className="pt-2 mt-2 border-t">
                    <h5 className="font-bold text-gray-700 text-xs mb-1">Purchase Orders:</h5>
                    <div className="space-y-1">
                        {associatedPOs.map(po => (
                            <button
                                key={po.id}
                                onClick={(e) => { e.stopPropagation(); onOpenPurchaseOrder(po); }}
                                className="w-full text-left p-1.5 rounded hover:bg-gray-200 transition-colors flex justify-between items-center text-xs"
                            >
                                <span className="font-mono font-semibold">{po.id}</span>
                                <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${getPoStatusColor(po.status, 'bg')} ${getPoStatusColor(po.status, 'text')}`}>
                                    {po.status}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
             <div className="flex justify-between items-center pt-2 border-t mt-2">
                <div className="flex items-center gap-4 text-xs">
                     {partsStatusInfo && <span title={partsStatusInfo.title} className={`flex items-center gap-1 font-semibold ${partsStatusInfo.color}`}>{partsStatusInfo.icon && <partsStatusInfo.icon size={14}/>} {partsStatus}</span>}
                    <span title={`Vehicle Status: ${currentVehicleStatus.text}`} className={`flex items-center gap-1 font-semibold ${currentVehicleStatus.color}`}>
                        <currentVehicleStatus.icon size={14}/> {currentVehicleStatus.text}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onOpenAssistant(job.id); }} className="p-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200" title="Technical Assistant"><Wand2 size={14} /></button>
                    {job.vehicleStatus === 'Awaiting Arrival' && <button onClick={() => onCheckIn(job.id)} className="p-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200" title="Check Vehicle In"><LogIn size={14} /></button>}
                    <button onClick={() => onEdit(job.id)} className="p-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200" title="Edit Job"><Edit size={14} /></button>
                </div>
            </div>
        </div>
    );
};

const AllocatedJobCard: React.FC<{
    job: Job;
    segment: JobSegment;
    vehicle?: Vehicle;
    customer?: Customer;
    engineer?: Engineer;
    purchaseOrders: PurchaseOrder[];
    onDragStart: (e: React.DragEvent, parentJobId: string, segmentId: string) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onEdit: (jobId: string) => void;
    onPause: (jobId: string, segmentId: string) => void;
    onRestart: (jobId: string, segmentId: string) => void;
    onReassign: (jobId: string, segmentId: string) => void;
    onOpenPurchaseOrder: (po: PurchaseOrder) => void;
    onUnscheduleSegment: (jobId: string, segmentId: string) => void;
    currentUser: User;
    onOpenAssistant: (jobId: string) => void;
}> = ({ job, segment, vehicle, customer, engineer, purchaseOrders, onDragStart, onDragEnd, onEdit, onPause, onRestart, onReassign, onOpenPurchaseOrder, onUnscheduleSegment, currentUser, onOpenAssistant }) => {
    const segments = segment.duration * (60 / SEGMENT_DURATION_MINUTES);
    const associatedPOs = (job.purchaseOrderIds || []).map(id => purchaseOrders.find(po => po.id === id)).filter(Boolean) as PurchaseOrder[];
    const [isPoMenuOpen, setIsPoMenuOpen] = useState(false);
    const poMenuRef = useRef<HTMLDivElement>(null);
    const canDrag = currentUser.role === 'Admin' || currentUser.role === 'Dispatcher';
    const canUnschedule = currentUser.role === 'Admin' || currentUser.role === 'Dispatcher';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (poMenuRef.current && !poMenuRef.current.contains(event.target as Node)) {
                setIsPoMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [poMenuRef]);
    
    let statusColor = 'bg-blue-500';
    if (segment.status === 'In Progress') statusColor = 'bg-yellow-500';
    if (segment.status === 'Engineer Complete') statusColor = 'bg-orange-500';
    if (segment.status === 'QC Complete') statusColor = 'bg-green-500';
    if (segment.status === 'Paused') statusColor = 'bg-red-500';

    const topPercent = (segment.scheduledStartSegment || 0) * (100 / TIME_SEGMENTS.length);
    const heightPercent = segments * (100 / TIME_SEGMENTS.length);
    
    return (
        <div
            draggable={canDrag}
            onDragStart={(e) => canDrag && onDragStart(e, job.id, segment.segmentId)}
            onDragEnd={onDragEnd}
            className={`absolute left-2 right-2 p-1.5 rounded-lg text-white shadow-lg flex flex-col group ${canDrag ? 'cursor-grab' : 'cursor-default'} ${statusColor} allocated-job-container z-10 hover:z-50 hover:shadow-xl transition-all duration-200`}
            style={{
                top: `${topPercent}%`,
                height: `${heightPercent}%`,
                minHeight: '80px', // Ensure buttons are visible even for short jobs
            }}
            title={`${job.description}\nAssigned to: ${engineer?.name}`}
        >
            <div className="flex justify-between items-start text-xs flex-shrink-0">
                <span className="font-bold truncate">{vehicle?.registration}</span>
                <div className="flex items-center gap-1">
                    {associatedPOs && associatedPOs.length > 0 && (
                        <div className="relative" ref={poMenuRef}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsPoMenuOpen(p => !p); }}
                                className="flex items-center gap-1 p-0.5 rounded-sm hover:bg-white/20"
                            >
                                <PackageIcon size={12} />
                                <span>{associatedPOs.length}</span>
                            </button>
                            {isPoMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded shadow-lg z-20 text-black animate-fade-in-up">
                                    <div className="p-1 font-bold text-xs border-b bg-gray-50">Purchase Orders</div>
                                    {associatedPOs.map(po => (
                                        <button 
                                            key={po.id} 
                                            onClick={(e) => { e.stopPropagation(); onOpenPurchaseOrder(po); setIsPoMenuOpen(false); }} 
                                            className="w-full text-left p-1.5 text-xs hover:bg-indigo-50 font-mono flex justify-between items-center"
                                        >
                                            <span>{po.id}</span>
                                            <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${getPoStatusColor(po.status, 'bg')} ${getPoStatusColor(po.status, 'text')}`}>
                                                {po.status}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {job.keyNumber && <span className="flex items-center gap-1"><KeyRound size={12}/> {job.keyNumber}</span>}
                </div>
            </div>
            
            <div className="flex-grow overflow-hidden my-0.5 min-h-0">
                 <p className="text-xs font-semibold truncate leading-tight">{job.description}</p>
                 <p className="text-[10px] truncate leading-tight opacity-80" title={getCustomerDisplayName(customer)}>{getCustomerDisplayName(customer)}</p>
            </div>
            
            <div className="flex justify-between items-end text-xs mt-auto pt-1 border-t border-white/20 flex-shrink-0">
                <span className="font-semibold truncate max-w-[60px]">{engineer?.name}</span>
                 <div className="flex items-center gap-0.5">
                    {segment.status === 'In Progress' && <button onClick={(e) => { e.stopPropagation(); onPause(job.id, segment.segmentId);}} title="Pause Job" className="p-1 rounded bg-white/20 hover:bg-white/40 text-white"><PauseCircle size={14} /></button>}
                    {segment.status === 'Paused' && <button onClick={(e) => { e.stopPropagation(); onRestart(job.id, segment.segmentId);}} title="Restart Job" className="p-1 rounded bg-white/20 hover:bg-white/40 text-white"><PlayCircle size={14} /></button>}
                    
                    {/* Ensure these buttons are rendered if permissions allow */}
                    {canDrag && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onReassign(job.id, segment.segmentId); }} 
                            title="Re-assign Engineer" 
                            className="p-1 rounded bg-white/20 hover:bg-white/40 text-white"
                        >
                            <UserCog size={14} />
                        </button>
                    )}
                    {canUnschedule && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onUnscheduleSegment(job.id, segment.segmentId); }} 
                            title="Return to Unallocated Queue" 
                            className="p-1 rounded bg-red-500/80 hover:bg-red-600 text-white"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                    
                    <button onClick={(e) => { e.stopPropagation(); onOpenAssistant(job.id); }} className="p-1 rounded bg-white/20 hover:bg-white/40 text-white" title="Assistant"><Wand2 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(job.id);}} className="p-1 rounded bg-white/20 hover:bg-white/40 text-white" title="Edit"><Edit size={14} /></button>
                </div>
            </div>
        </div>
    );
};

const liftColorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-200 text-gray-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    pink: 'bg-pink-100 text-pink-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
};

interface TimelineViewProps {
    onDragStart: (e: React.DragEvent, parentJobId: string, segmentId: string) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onTimelineDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
    onTimelineDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onTimelineDragOver: (e: React.DragEvent<HTMLDivElement>, liftId: string) => void;
    onTimelineDrop: (e: React.DragEvent<HTMLDivElement>, liftId: string) => void;
    onDragOverUnallocated: (e: React.DragEvent) => void;
    onDropOnUnallocated: (e: React.DragEvent) => void;
    onDragEnterUnallocated: (e: React.DragEvent) => void;
    onDragLeaveUnallocated: (e: React.DragEvent) => void;
    unallocatedJobs: Job[];
    allocatedSegmentsByLift: Map<string, (JobSegment & { parentJobId: string; })[]>;
    unallocatedDateFilter: 'all' | 'today' | '7days' | '14days';
    setUnallocatedDateFilter: React.Dispatch<React.SetStateAction<'all' | 'today' | '7days' | '14days'>>;
    showOnSiteOnly: boolean;
    setShowOnSiteOnly: React.Dispatch<React.SetStateAction<boolean>>;
    onEditJob: (jobId: string) => void;
    onCheckIn: (jobId: string) => void;
    onOpenPurchaseOrder: (po: PurchaseOrder) => void;
    onPause: (jobId: string, segmentId: string) => void;
    onRestart: (jobId: string, segmentId: string) => void;
    onReassign: (jobId: string, segmentId: string) => void;
    onUnscheduleSegment: (jobId: string, segmentId: string) => void;
    onOpenAssistant: (jobId: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = (props) => {
    const { 
        onDragStart, onDragEnd, onTimelineDragEnter, onTimelineDragLeave, onTimelineDragOver, onTimelineDrop,
        onDragOverUnallocated, onDropOnUnallocated, onDragEnterUnallocated, onDragLeaveUnallocated,
        unallocatedJobs, allocatedSegmentsByLift, unallocatedDateFilter, setUnallocatedDateFilter, showOnSiteOnly,
        setShowOnSiteOnly, onEditJob, onCheckIn, onOpenPurchaseOrder, onPause, onRestart, onReassign, 
        onUnscheduleSegment, onOpenAssistant
    } = props;
    
    const { jobs, lifts, engineers, customers, vehicles, purchaseOrders, businessEntities } = useData();
    const { currentUser, selectedEntityId } = useApp();

    const entityLifts = useMemo(() => lifts.filter(l => l.entityId === selectedEntityId), [lifts, selectedEntityId]);
    const vehiclesById = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);
    const customersById = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
    const engineersById = useMemo(() => new Map(engineers.map(e => [e.id, e])), [engineers]);

    const totalUnallocatedHours = useMemo(() => {
        return unallocatedJobs.reduce((sum, job) => sum + job.estimatedHours, 0);
    }, [unallocatedJobs]);
    
    return (
        <div className="flex-grow flex p-4 gap-4 min-h-0">
             <div
                className="w-80 flex-shrink-0 flex flex-col bg-gray-100 rounded-lg shadow-inner unallocated-drop-zone min-h-0"
                onDragOver={onDragOverUnallocated}
                onDrop={onDropOnUnallocated}
                onDragEnter={onDragEnterUnallocated}
                onDragLeave={onDragLeaveUnallocated}
            >
                 <div className="p-3 border-b">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-800">Unallocated Jobs</h3>
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 bg-gray-200 px-2 py-1 rounded-full" title="Total hours for filtered unallocated jobs">
                            <Clock size={14} />
                            {totalUnallocatedHours.toFixed(1)}h
                        </span>
                    </div>
                    <div className="flex gap-1 p-1 bg-gray-200 rounded-lg mt-2">
                        {(['all', 'today', '7days', '14days'] as const).map(opt => (
                            <button
                                key={opt}
                                onClick={() => setUnallocatedDateFilter(opt)}
                                className={`w-full py-1 rounded-md font-semibold text-xs transition capitalize ${unallocatedDateFilter === opt ? 'bg-white shadow' : 'text-gray-600'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                     <div className="flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            id="show-on-site"
                            checked={showOnSiteOnly}
                            onChange={(e) => setShowOnSiteOnly(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="show-on-site" className="text-sm text-gray-700">
                            Show 'On Site' vehicles only
                        </label>
                    </div>
                </div>
                <div className="flex-grow p-3 space-y-3 overflow-y-auto">
                    {unallocatedJobs.map(job => (
                        <DraggableJobCard
                            key={job.id}
                            job={job}
                            vehicle={vehiclesById.get(job.vehicleId)}
                            customer={customersById.get(job.customerId)}
                            purchaseOrders={purchaseOrders}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onEdit={onEditJob}
                            onCheckIn={onCheckIn}
                            onOpenPurchaseOrder={onOpenPurchaseOrder}
                            currentUser={currentUser}
                            onOpenAssistant={onOpenAssistant}
                        />
                    ))}
                </div>
            </div>
            <div
                className="flex-grow flex bg-white rounded-lg shadow-md overflow-x-auto min-w-0"
            >
                <div className="flex-shrink-0 border-r flex flex-col bg-white sticky left-0 z-20">
                    <h4 className="flex items-center justify-center font-bold p-2 border-b sticky top-0 bg-white z-30 text-transparent select-none h-16">&nbsp;</h4>
                    {TIME_SEGMENTS.map(time => <div key={time} className="flex-1 text-xs text-right pr-2 text-gray-500 border-b flex items-center justify-end">{time}</div>)}
                </div>
                <div className="flex-grow flex">
                    {entityLifts.map(lift => {
                        const allocatedSegments = allocatedSegmentsByLift.get(lift.id);
                        return (
                        <div key={lift.id} className="min-w-[140px] flex-1 border-r flex flex-col">
                            <h4 className={`flex items-center justify-center text-center font-bold p-2 border-b sticky top-0 z-10 h-16 ${liftColorClasses[lift.color || 'gray']}`}>{lift.name}</h4>
                            <div 
                                className="flex-grow relative flex flex-col"
                                onDragEnter={onTimelineDragEnter}
                                onDragLeave={onTimelineDragLeave}
                                onDragOver={(e) => onTimelineDragOver(e, lift.id)}
                                onDrop={(e) => onTimelineDrop(e, lift.id)}
                            >
                                {TIME_SEGMENTS.map((_, index) => <div key={index} className="flex-1 border-b border-gray-200"></div>)}
                                {allocatedSegments?.map(segment => {
                                    const job = jobs.find(j => j.id === segment.parentJobId);
                                    const vehicle = job ? vehiclesById.get(job.vehicleId) : undefined;
                                    const engineer = segment.engineerId ? engineersById.get(segment.engineerId) : undefined;
                                    const customer = job ? customersById.get(job.customerId) : undefined;
                                    if (!job) return null;
                                    return <AllocatedJobCard 
                                        key={segment.segmentId}
                                        job={job}
                                        segment={segment}
                                        vehicle={vehicle}
                                        customer={customer}
                                        engineer={engineer}
                                        purchaseOrders={purchaseOrders}
                                        onDragStart={onDragStart}
                                        onDragEnd={onDragEnd}
                                        onEdit={onEditJob}
                                        onPause={onPause}
                                        onRestart={onRestart}
                                        onReassign={onReassign}
                                        onOpenPurchaseOrder={onOpenPurchaseOrder}
                                        onUnscheduleSegment={onUnscheduleSegment}
                                        currentUser={currentUser}
                                        onOpenAssistant={onOpenAssistant}
                                    />;
                                })}
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        </div>
    );
};

const WeeklyView: React.FC<{
    weekStart: Date;
    onEditJob: (jobId: string) => void;
    onOpenAssistant: (jobId: string) => void;
}> = ({ weekStart, onEditJob, onOpenAssistant }) => {
    const { jobs, vehicles, customers, businessEntities } = useData();
    const { selectedEntityId } = useApp();
    const vehiclesById = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);
    const customersById = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);

    const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

    const dailyCapacityHours = useMemo(() => {
        return businessEntities.find(e => e.id === selectedEntityId)?.dailyCapacityHours || 0;
    }, [businessEntities, selectedEntityId]);

    const allocatedHoursByDay = useMemo(() => {
        const map = new Map<string, number>();
        days.forEach(day => {
            const dateStr = formatDate(day);
            let totalHours = 0;
            jobs.forEach(job => {
                if (selectedEntityId !== 'all' && job.entityId !== selectedEntityId) return;
                job.segments.forEach(segment => {
                    if (segment.date === dateStr && segment.status !== 'Unallocated') {
                        totalHours += segment.duration;
                    }
                });
            });
            map.set(dateStr, totalHours);
        });
        return map;
    }, [jobs, days, selectedEntityId]);

    const jobsByDay = useMemo(() => {
        const map = new Map<string, Job[]>();
        days.forEach(day => {
            const dateStr = formatDate(day);
            map.set(dateStr, []);
        });

        jobs.forEach(job => {
            if (selectedEntityId !== 'all' && job.entityId !== selectedEntityId) return;
            const uniqueDates = new Set(job.segments.map(s => s.date).filter(Boolean));
            uniqueDates.forEach(date => {
                if(date && map.has(date)) {
                    map.get(date)!.push(job);
                }
            });
        });
        return map;
    }, [jobs, days, selectedEntityId]);
    
    return (
        <div className="flex-grow flex flex-col p-4 bg-gray-100">
            <div className="grid grid-cols-7 text-xs font-bold text-center text-gray-500 border-b pb-2 mb-2 flex-shrink-0 bg-white sticky top-0 py-2 rounded-t-lg">
                {days.map(day => {
                    const dateStr = formatDate(day);
                    const allocatedHours = allocatedHoursByDay.get(dateStr) || 0;
                    const capacityInfo = getCapacityInfo(allocatedHours, dailyCapacityHours);

                    return (
                        <div key={day.toISOString()} className="flex flex-col items-center justify-start gap-1">
                            <span className="font-bold text-gray-700">
                                {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                                <span className="text-gray-500 font-medium ml-1">{day.getUTCDate()}</span>
                            </span>
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs ${capacityInfo.classes}`}>
                                <Gauge size={12} />
                                <span className="font-semibold">{allocatedHours.toFixed(1)}h / {dailyCapacityHours}h</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="grid grid-cols-7 gap-2 flex-grow min-h-0">
                {days.map(day => {
                    const dateStr = formatDate(day);
                    const dailyJobs = jobsByDay.get(dateStr) || [];
                    const isWeekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;

                    return (
                        <div key={dateStr} className={`rounded-lg p-2 space-y-2 overflow-y-auto ${isWeekend ? 'bg-gray-200' : 'bg-white shadow-inner'}`}>
                            {dailyJobs.map(job => {
                                const vehicle = vehiclesById.get(job.vehicleId);
                                const customer = customersById.get(job.customerId);
                                return (
                                    <div
                                        key={job.id}
                                        onClick={() => onEditJob(job.id)}
                                        className="p-2 bg-blue-50 border border-blue-200 rounded-md cursor-pointer hover:bg-blue-100 text-xs animate-fade-in"
                                        title={`${job.description}\nCustomer: ${getCustomerDisplayName(customer)}`}
                                    >
                                        <p className="font-bold truncate">{vehicle?.registration}</p>
                                        <p className="text-gray-700 truncate">{job.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface DispatchViewProps {
    setDefaultDateForModal: (date: string | null) => void;
    setIsSmartCreateOpen: (isOpen: boolean) => void;
    setSmartCreateMode: (mode: 'job' | 'estimate') => void;
    setSelectedJobId: (id: string | null) => void;
    setIsEditModalOpen: (isOpen: boolean) => void;
    onOpenPurchaseOrder: (po: PurchaseOrder) => void;
    onPause: (jobId: string, segmentId: string) => void;
    onRestart: (jobId: string, segmentId: string) => void;
    onReassignEngineer: (jobId: string, segmentId: string, newEngineerId: string) => void;
    onCheckIn: (jobId: string) => void;
    onOpenAssistant: (jobId: string) => void;
    onUnscheduleSegment: (jobId: string, segmentId: string) => void;
}

const DispatchView: React.FC<DispatchViewProps> = ({ setDefaultDateForModal, setIsSmartCreateOpen, setSmartCreateMode, setSelectedJobId, setIsEditModalOpen, onOpenPurchaseOrder, onPause, onRestart, onReassignEngineer, onCheckIn, onOpenAssistant, onUnscheduleSegment }) => {
    const { jobs, setJobs, lifts, engineers, customers, vehicles, purchaseOrders, absenceRequests, businessEntities } = useData();
    const { currentUser, selectedEntityId, setCheckingInJobId, setIsCheckInOpen } = useApp();
    
    const [viewMode, setViewMode] = useState<'timeline' | 'week' | 'calendar'>('timeline');
    const [currentDate, setCurrentDate] = useState(getRelativeDate(0));
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [unallocatedDateFilter, setUnallocatedDateFilter] = useState<'all' | 'today' | '7days' | '14days'>('all');
    const [showOnSiteOnly, setShowOnSiteOnly] = useState(false);
    const [currentMonthDate, setCurrentMonthDate] = useState(dateStringToDate(getRelativeDate(0)));
    const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
    
    const [assignModalData, setAssignModalData] = useState<{ job: Job, segment: JobSegment, lift: Lift, startSegmentIndex: number, currentEngineerId?: string | null } | null>(null);
    const [reassignModalData, setReassignModalData] = useState<{ jobId: string; segmentId: string; liftName: string; startSegmentIndex: number; currentEngineerId?: string | null; } | null>(null);

    const draggedItemRef = useRef<DraggedSegmentData | null>(null);
    const dropResultRef = useRef<{ type: 'TIMELINE', liftId: string, startSegmentIndex: number } | { type: 'UNALLOCATED' } | null>(null);
    const dragImageRef = useRef<HTMLElement | null>(null);

    const entityLifts = useMemo(() => lifts.filter(l => l.entityId === selectedEntityId), [lifts, selectedEntityId]);
    const entityEngineers = useMemo(() => engineers.filter(e => e.entityId === selectedEntityId), [engineers, selectedEntityId]);
    
    const { unallocatedJobs, allocatedSegmentsByLift } = useMemo(() => {
        const today = getRelativeDate(0);
        const allPotentialUnallocated = jobs.filter(job => (selectedEntityId === 'all' || job.entityId === selectedEntityId) && (job.segments || []).some(s => s.status === 'Unallocated'));
        const siteFilteredJobs = showOnSiteOnly ? allPotentialUnallocated.filter(job => job.vehicleStatus === 'On Site') : allPotentialUnallocated;
        const dateFilteredJobs = siteFilteredJobs.filter(job => {
            if (unallocatedDateFilter === 'all') return true;
            const firstUnallocatedSegment = (job.segments || []).find(s => s.status === 'Unallocated');
            if (!firstUnallocatedSegment?.date) return false;
            const jobDate = firstUnallocatedSegment.date;
            if (unallocatedDateFilter === 'today') return jobDate === today;
            if (unallocatedDateFilter === '7days') return jobDate >= today && jobDate <= getRelativeDate(6);
            if (unallocatedDateFilter === '14days') return jobDate >= today && jobDate <= getRelativeDate(13);
            return false;
        });
        const finalUnallocated = dateFilteredJobs;
        const allocated = new Map<string, (JobSegment & { parentJobId: string })[]>();
        jobs.forEach(job => {
            if (selectedEntityId !== 'all' && job.entityId !== selectedEntityId) return;
            (job.segments || []).forEach(segment => {
                if (segment.date === currentDate && segment.allocatedLift && segment.status !== 'Unallocated') {
                    if (!allocated.has(segment.allocatedLift)) allocated.set(segment.allocatedLift, []);
                    allocated.get(segment.allocatedLift)!.push({ ...segment, parentJobId: job.id });
                }
            });
        });
        return { unallocatedJobs: finalUnallocated, allocatedSegmentsByLift: allocated };
    }, [jobs, currentDate, selectedEntityId, unallocatedDateFilter, showOnSiteOnly]);

    const handleDragStart = useCallback((e: React.DragEvent, parentJobId: string, segmentId: string) => {
        const job = jobs.find(j => j.id === parentJobId);
        const segment = job?.segments.find(s => s.segmentId === segmentId);
        if (segment) {
            const dragData = { parentJobId, segmentId, duration: segment.duration };
            e.dataTransfer.setData('application/json', JSON.stringify(dragData));
            draggedItemRef.current = dragData;
        }
        e.dataTransfer.effectAllowed = 'move';
        dropResultRef.current = null;
        
        const sourceElement = e.currentTarget as HTMLElement;
        sourceElement.classList.add('is-dragging-source');
        
        if (dragImageRef.current) document.body.removeChild(dragImageRef.current);
        const clone = sourceElement.cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.top = '-9999px';
        clone.style.width = `${sourceElement.offsetWidth}px`;
        clone.style.transform = 'rotate(2deg)';
        document.body.appendChild(clone);
        dragImageRef.current = clone;
        e.dataTransfer.setDragImage(clone, clone.offsetWidth / 2, clone.offsetHeight / 2);
    }, [jobs]);

    const checkCollisionOnDate = useCallback((date: string, liftId: string, startSegmentIndex: number, durationInSegments: number, draggedSegmentId?: string) => {
        const segmentsOnLiftAndDate = jobs
            .flatMap(j => j.segments || [])
            .filter(s => s.date === date && s.allocatedLift === liftId && s.segmentId !== draggedSegmentId);
    
        if (startSegmentIndex < 0 || startSegmentIndex + durationInSegments > TIME_SEGMENTS.length) {
            return true;
        }

        for (let i = 0; i < durationInSegments; i++) {
            const timeSlotIndex = startSegmentIndex + i;
            const isOccupied = segmentsOnLiftAndDate.some(s => {
                if (s.scheduledStartSegment === null) return false;
                const sEndIndex = s.scheduledStartSegment + (s.duration * (60 / SEGMENT_DURATION_MINUTES));
                return timeSlotIndex >= s.scheduledStartSegment && timeSlotIndex < sEndIndex;
            });
            if (isOccupied) return true;
        }
        return false;
    }, [jobs]);

    const handleTimelineDragOver = useCallback((e: React.DragEvent, liftId: string) => {
        e.preventDefault();
        if (!draggedItemRef.current) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const segmentHeight = rect.height / TIME_SEGMENTS.length;
        const hoverSegmentIndex = Math.floor(offsetY / segmentHeight);
        
        dropResultRef.current = { type: 'TIMELINE', liftId, startSegmentIndex: hoverSegmentIndex };
        
        // Visual feedback logic (simplified)
        document.querySelectorAll('.timeline-column-over').forEach(el => el.classList.remove('timeline-column-over'));
        e.currentTarget.classList.add('timeline-column-over');
    }, []);

    const handleTimelineDrop = useCallback((e: React.DragEvent, liftId: string) => {
        e.preventDefault();
        e.currentTarget.classList.remove('timeline-column-over');
        
        if (dropResultRef.current?.type === 'TIMELINE' && draggedItemRef.current) {
            const { startSegmentIndex } = dropResultRef.current;
            const { parentJobId, segmentId, duration } = draggedItemRef.current;
            const durationInSegments = duration * (60 / SEGMENT_DURATION_MINUTES);

            // Optimistic check: if collision, try to find next available slot on same lift
            let finalStartIndex = startSegmentIndex;
            if (checkCollisionOnDate(currentDate, liftId, finalStartIndex, durationInSegments, segmentId)) {
                // Simple search forward
                let found = false;
                for (let i = 0; i < TIME_SEGMENTS.length - durationInSegments; i++) {
                    if (!checkCollisionOnDate(currentDate, liftId, i, durationInSegments, segmentId)) {
                        finalStartIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    alert("No space available on this lift for the entire duration.");
                    return;
                }
            }
            
            const job = jobs.find(j => j.id === parentJobId);
            const segment = job?.segments.find(s => s.segmentId === segmentId);
            const lift = lifts.find(l => l.id === liftId);

            if (job && segment && lift) {
                setAssignModalData({ job, segment, lift, startSegmentIndex: finalStartIndex, currentEngineerId: segment.engineerId });
            }
        }
        draggedItemRef.current = null;
    }, [jobs, lifts, currentDate, checkCollisionOnDate]);

    const handleUnallocatedDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const unallocatedZone = e.currentTarget;
        unallocatedZone.classList.remove('is-over');
        
        if (dropResultRef.current?.type === 'UNALLOCATED' && draggedItemRef.current) {
            const { parentJobId, segmentId } = draggedItemRef.current;
            
             setJobs(prev => prev.map(job => {
                if (job.id === parentJobId) {
                    const newSegments = job.segments.map(s => 
                        s.segmentId === segmentId ? { ...s, status: 'Unallocated' as const, allocatedLift: null, scheduledStartSegment: null, engineerId: null } : s
                    );
                    return { ...job, segments: newSegments, status: calculateJobStatus(newSegments) };
                }
                return job;
            }));
        }
        draggedItemRef.current = null;
    }, [setJobs]);
    
    const handleDragEnd = useCallback((e: React.DragEvent) => {
        const sourceElement = e.currentTarget as HTMLElement;
        sourceElement.classList.remove('is-dragging-source');
        if (dragImageRef.current && document.body.contains(dragImageRef.current)) {
            document.body.removeChild(dragImageRef.current);
        }
        draggedItemRef.current = null;
        dropResultRef.current = null;
    }, []);

    const handleAssignConfirm = (engineerId: string, startSegmentIndex: number) => {
        if (!assignModalData) return;
        const { job, segment, lift } = assignModalData;

        // Final check before commit
        const durationInSegments = segment.duration * (60 / SEGMENT_DURATION_MINUTES);
         if (checkCollisionOnDate(currentDate, lift.id, startSegmentIndex, durationInSegments, segment.segmentId)) {
            alert("Slot is no longer available.");
            return;
        }

        setJobs(prev => prev.map(j => {
            if (j.id === job.id) {
                const newSegments = j.segments.map(s => 
                    s.segmentId === segment.segmentId ? { 
                        ...s, 
                        status: 'Allocated' as const, 
                        allocatedLift: lift.id, 
                        scheduledStartSegment: startSegmentIndex, 
                        date: currentDate,
                        engineerId: engineerId
                    } : s
                );
                return { ...j, segments: newSegments, status: calculateJobStatus(newSegments) };
            }
            return j;
        }));
        setAssignModalData(null);
    };

    const handleMonthChange = (offset: number) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), 1));
            newDate.setUTCMonth(newDate.getUTCMonth() + offset);
            return newDate;
        });
    };

    const handleToday = () => {
        const today = dateStringToDate(getRelativeDate(0));
        setCurrentDate(formatDate(today));
        setCurrentMonthDate(today);
        setWeekStart(getStartOfWeek(today));
    };

    const absencesByDate = useMemo(() => {
        const map = new Map<string, number>();
        absenceRequests.forEach(req => {
            if (req.status === 'Approved' || req.status === 'Pending') {
                 let curr = dateStringToDate(req.startDate);
                 const end = dateStringToDate(req.endDate);
                 while(curr <= end) {
                    const dateStr = formatDate(curr);
                    map.set(dateStr, (map.get(dateStr) || 0) + 8);
                    curr = addDays(curr, 1);
                }
            }
        });
        return map;
    }, [absenceRequests]);
    
    const dailyCapacity = useMemo(() => {
        return businessEntities.find(e => e.id === selectedEntityId)?.dailyCapacityHours || 40;
    }, [businessEntities, selectedEntityId]);

    const handlePrevDay = () => {
        const d = dateStringToDate(currentDate);
        setCurrentDate(formatDate(addDays(d, -1)));
    };

    const handleNextDay = () => {
         const d = dateStringToDate(currentDate);
         setCurrentDate(formatDate(addDays(d, 1)));
    };
    
    const handleReassignClick = (jobId: string, segmentId: string) => {
        const job = jobs.find(j => j.id === jobId);
        const segment = job?.segments.find(s => s.segmentId === segmentId);
        const lift = lifts.find(l => l.id === segment?.allocatedLift);

        if (job && segment && lift && segment.scheduledStartSegment !== null) {
            setReassignModalData({
                jobId,
                segmentId,
                liftName: lift.name,
                startSegmentIndex: segment.scheduledStartSegment,
                currentEngineerId: segment.engineerId
            });
        }
    };
    
    const handleReassignConfirm = (engineerId: string) => {
        if (!reassignModalData) return;
        
        onReassignEngineer(reassignModalData.jobId, reassignModalData.segmentId, engineerId);
        setReassignModalData(null);
    };

    return (
        <div className="w-full h-full flex flex-col">
            <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-30">
                <div className="flex items-center gap-4">
                     <div className="flex bg-gray-200 rounded-lg p-1">
                        <button onClick={() => setViewMode('timeline')} className={`px-4 py-2 rounded-md font-semibold text-sm transition ${viewMode === 'timeline' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-800'}`}>Day Timeline</button>
                        <button onClick={() => setViewMode('week')} className={`px-4 py-2 rounded-md font-semibold text-sm transition ${viewMode === 'week' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-800'}`}>Week View</button>
                        <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-md font-semibold text-sm transition ${viewMode === 'calendar' ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-800'}`}>Month Calendar</button>
                    </div>

                    <div className="flex items-center gap-2">
                        {viewMode === 'timeline' && (
                             <>
                                <button onClick={handlePrevDay} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft size={20}/></button>
                                <button onClick={() => setIsDatePickerOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700">
                                    <Clock size={18} />
                                    <span>{formatReadableDate(currentDate)}</span>
                                </button>
                                <button onClick={handleNextDay} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight size={20}/></button>
                             </>
                        )}
                         {viewMode === 'week' && (
                             <>
                                <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft size={20}/></button>
                                <span className="font-semibold px-2">Week of {formatReadableDate(formatDate(weekStart))}</span>
                                <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight size={20}/></button>
                             </>
                        )}
                         {viewMode === 'calendar' && (
                             <>
                                <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft size={20}/></button>
                                <span className="font-semibold px-2">{currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
                                <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight size={20}/></button>
                             </>
                        )}
                        <button onClick={handleToday} className="text-sm font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded">Today</button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setIsSmartCreateOpen(true); setSmartCreateMode('job'); setDefaultDateForModal(currentDate); }} className="flex items-center gap-2 py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition">
                        <PlusCircle size={20}/> Smart Create Job
                    </button>
                </div>
            </header>
            
            {viewMode === 'timeline' && (
                <TimelineView
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onTimelineDragEnter={(e) => { e.preventDefault(); }}
                    onTimelineDragLeave={(e) => { e.currentTarget.classList.remove('timeline-column-over'); }}
                    onTimelineDragOver={handleTimelineDragOver}
                    onTimelineDrop={handleTimelineDrop}
                    onDragOverUnallocated={(e) => { e.preventDefault(); dropResultRef.current = { type: 'UNALLOCATED' }; e.currentTarget.classList.add('is-over'); }}
                    onDropOnUnallocated={handleUnallocatedDrop}
                    onDragEnterUnallocated={(e) => e.currentTarget.classList.add('is-over')}
                    onDragLeaveUnallocated={(e) => e.currentTarget.classList.remove('is-over')}
                    unallocatedJobs={unallocatedJobs}
                    allocatedSegmentsByLift={allocatedSegmentsByLift}
                    unallocatedDateFilter={unallocatedDateFilter}
                    setUnallocatedDateFilter={setUnallocatedDateFilter}
                    showOnSiteOnly={showOnSiteOnly}
                    setShowOnSiteOnly={setShowOnSiteOnly}
                    onEditJob={(id) => { setSelectedJobId(id); setIsEditModalOpen(true); }}
                    onCheckIn={onCheckIn}
                    onOpenPurchaseOrder={onOpenPurchaseOrder}
                    onPause={onPause}
                    onRestart={onRestart}
                    onReassign={handleReassignClick}
                    onUnscheduleSegment={onUnscheduleSegment}
                    onOpenAssistant={onOpenAssistant}
                />
            )}
            
            {viewMode === 'calendar' && (
                <div className="flex-grow p-4 min-h-0 bg-gray-100">
                    <BookingCalendarView
                        jobs={jobs.filter(j => selectedEntityId === 'all' || j.entityId === selectedEntityId)}
                        vehicles={vehicles}
                        customers={customers}
                        onAddJob={(date) => { setDefaultDateForModal(date); setIsSmartCreateOpen(true); setSmartCreateMode('job'); }}
                        onDragStart={() => {}} // No drag in month view
                        maxDailyCapacityHours={dailyCapacity}
                        absencesByDate={absencesByDate}
                        onDayClick={(date) => { setCurrentDate(date); setViewMode('timeline'); }}
                        onEditJob={(id) => { setSelectedJobId(id); setIsEditModalOpen(true); }}
                        currentMonthDate={currentMonthDate}
                        selectedDate={currentDate}
                    />
                </div>
            )}
            
            {viewMode === 'week' && (
                <WeeklyView 
                    weekStart={weekStart}
                    onEditJob={(id) => { setSelectedJobId(id); setIsEditModalOpen(true); }}
                    onOpenAssistant={onOpenAssistant}
                />
            )}
            
            {isDatePickerOpen && (
                <DatePickerModal
                    isOpen={isDatePickerOpen}
                    onClose={() => setIsDatePickerOpen(false)}
                    onSelectDate={(date) => { setCurrentDate(date); setIsDatePickerOpen(false); }}
                    currentDate={currentDate}
                    jobs={jobs}
                    maxDailyCapacityHours={dailyCapacity}
                    absencesByDate={absencesByDate}
                />
            )}
            
            {assignModalData && (
                <AssignEngineerModal
                    isOpen={!!assignModalData}
                    onClose={() => setAssignModalData(null)}
                    onAssign={handleAssignConfirm}
                    engineers={entityEngineers}
                    jobInfo={{ resourceName: assignModalData.lift.name }}
                    initialStartSegmentIndex={assignModalData.startSegmentIndex}
                    initialEngineerId={assignModalData.currentEngineerId}
                    timeSegments={TIME_SEGMENTS}
                />
            )}

            {reassignModalData && (
                <AssignEngineerModal
                    isOpen={!!reassignModalData}
                    onClose={() => setReassignModalData(null)}
                    onAssign={(engId) => handleReassignConfirm(engId)}
                    engineers={entityEngineers}
                    jobInfo={{ resourceName: reassignModalData.liftName }}
                    initialStartSegmentIndex={reassignModalData.startSegmentIndex}
                    initialEngineerId={reassignModalData.currentEngineerId}
                    timeSegments={TIME_SEGMENTS}
                />
            )}
        </div>
    );
};

export default DispatchView;