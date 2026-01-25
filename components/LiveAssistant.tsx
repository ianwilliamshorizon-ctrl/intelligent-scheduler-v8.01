import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../core/state/DataContext';
import { useApp } from '../core/state/AppContext';
import { X, Send, BrainCircuit, Mic } from 'lucide-react';
import { Job, Vehicle, Customer, Part, ServicePackage } from '../types';
import { Note } from '../types/index';
import { getJobById } from '../core/utils/jobUtils';

interface LiveAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string | null;
    onAddNote: (note: Note) => void;
    onReviewPackage: (packageId: string) => void;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ isOpen, onClose, jobId, onAddNote, onReviewPackage }) => {
    const { jobs, vehicles, customers, parts, servicePackages } = useData();
    const { users, currentUser } = useApp();
    const [job, setJob] = useState<Job | null>(null);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string; jsx?: React.ReactNode }[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (jobId) {
            const currentJob = getJobById(jobId, jobs);
            if(currentJob) {
                setJob(currentJob);
                const jobVehicle = vehicles.find(v => v.id === currentJob.vehicleId);
                setVehicle(jobVehicle || null);
                const jobCustomer = customers.find(c => c.id === currentJob.customerId);
                setCustomer(jobCustomer || null);
                setMessages([{
                    sender: 'ai',
                    text: `Hello! I'm here to assist with Job #${currentJob.id} for the ${jobVehicle?.make} ${jobVehicle?.model} (${jobVehicle?.registration}). How can I help?`,
                }]);
            }
        } else {
             setMessages([{
                sender: 'ai',
                text: `Hello! I'm your live assistant. How can I help you today?`,
            }]);
        }
    }, [jobId, jobs, vehicles, customers]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (input.trim() === '') return;
        const userMessage = { sender: 'user' as 'user' | 'ai', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsThinking(true);

        setTimeout(() => {
            const response = getAIResponse(input, { job, vehicle, customer, parts, servicePackages });
            setMessages(prev => [...prev, response]);
            setIsThinking(false);
            if (response.action === 'addNote' && response.payload) {
                onAddNote(response.payload as Note);
            }
        }, 1200);
    };
    
    const getAIResponse = (query: string, context: any): { sender: 'ai'; text: string; jsx?: React.ReactNode; action?: string; payload?: any } => {
        const q = query.toLowerCase();

        if (q.includes('summary') || q.includes('recap')) {
            if (!context.job) {
                return { sender: 'ai', text: "I don't have a job context. Please open the assistant from a job view." };
            }
            return {
                sender: 'ai',
                text: `Here's a summary for Job #${context.job.id}:`,
                jsx: (
                    <div>
                        <p><strong>Vehicle:</strong> ${context.vehicle?.make} ${context.vehicle?.model} (${context.vehicle?.registration})</p>
                        <p><strong>Customer:</strong> ${context.customer?.forename} ${context.customer?.surname}</p>
                        <p><strong>Description:</strong> ${context.job?.description}</p>
                        <p><strong>Status:</strong> ${context.job?.status}</p>
                        {context.job.technicianId && <p><strong>Technician:</strong> ${users.find(u=>u.id === context.job.technicianId)?.name}</p>}
                    </div>
                )
            };
        }

        if (q.includes('add note')) {
             if (!context.job) {
                return { sender: 'ai', text: "I can't add a note without a job context." };
            }
             const noteText = query.substring(query.indexOf('add note') + 9);
             const newNote: Note = {
                id: crypto.randomUUID(),
                jobId: context.job.id,
                text: `(From Assistant) ${noteText}`,
                userId: currentUser.id,
                timestamp: new Date().toISOString()
             };
             return {
                 sender: 'ai',
                 text: `I've added the note: "${noteText}".`,
                 action: 'addNote',
                 payload: newNote
             };
        }
        
        return { sender: 'ai', text: "I'm sorry, I can't help with that specific request yet." };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-[100] border-2 border-indigo-200 animate-slide-in-up">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-indigo-50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <div className="text-indigo-600"><BrainCircuit size={24} /></div>
                    <h2 className="text-lg font-bold text-gray-800">Live Assistant</h2>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={20} /></button>
            </header>

            <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                             {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0"><BrainCircuit size={18} /></div>}
                            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                                <p className="text-sm">{msg.text}</p>
                                {msg.jsx && <div className="mt-2 text-sm">{msg.jsx}</div>}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                         <div className="flex items-start gap-3">
                             <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0"><BrainCircuit size={18} /></div>
                            <div className="max-w-[80%] p-3 rounded-2xl bg-white text-gray-800 border border-gray-200 rounded-bl-none">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>

                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <footer className="flex-shrink-0 p-4 border-t bg-white rounded-b-2xl">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question or give a command..."
                        className="w-full p-3 pr-20 bg-gray-100 rounded-full border-2 border-transparent focus:border-indigo-500 focus:ring-0 focus:outline-none transition"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-100">
                            <Mic size={20} />
                        </button>
                        <button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg">
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LiveAssistant;
