import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../store/toast.store';
import type { ToastItem, ToastType } from '../store/toast.store';

const CONFIG: Record<ToastType, { icon: any; border: string; iconColor: string; bar: string }> = {
    success: { icon: CheckCircle, border: 'border-emerald-200', iconColor: 'text-emerald-500', bar: 'bg-emerald-500' },
    error:   { icon: XCircle,     border: 'border-red-200',     iconColor: 'text-red-500',     bar: 'bg-red-500' },
    info:    { icon: Info,        border: 'border-blue-200',    iconColor: 'text-blue-500',    bar: 'bg-blue-500' },
};

function ToastEntry({ toast }: { toast: ToastItem }) {
    const removeToast = useToastStore(s => s.removeToast);
    const cfg = CONFIG[toast.type];
    const Icon = cfg.icon;

    return (
        <div className={`relative flex items-start gap-3 bg-white border ${cfg.border} shadow-xl rounded-xl px-4 py-3 min-w-72 max-w-sm overflow-hidden`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar} rounded-l-xl`} />
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ml-1 ${cfg.iconColor}`} />
            <p className="flex-1 text-sm font-medium text-slate-800">{toast.message}</p>
            <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export default function ToastContainer() {
    const toasts = useToastStore(s => s.toasts);

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className="pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300">
                    <ToastEntry toast={t} />
                </div>
            ))}
        </div>
    );
}
