import { X, Trash, Play } from '@phosphor-icons/react';

export type ConfirmVariant = 'danger' | 'primary';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: ConfirmVariant;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    isOpen, title, message, confirmLabel = 'Bestätigen', variant = 'primary', onConfirm, onCancel
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const isDanger = variant === 'danger';

    return (
        <div className="fixed inset-0 z-[150] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />
                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-100' : 'bg-blue-100'}`}>
                            {isDanger
                                ? <Trash size={20} className="text-red-600" />
                                : <Play size={20} className="text-blue-600" />
                            }
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{message}</p>
                        </div>
                        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 p-1">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onCancel}
                            className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={() => { onConfirm(); onCancel(); }}
                            className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-sm ${
                                isDanger
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                            }`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
