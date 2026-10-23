'use client';

import React, { useState } from 'react';
import { 
  UploadCloud, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export default function UploadModal({
  isOpen,
  onClose,
  onUpload,
  isUploading,
}: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
      } else {
        setStatusMsg({ type: 'error', text: 'Por favor, selecione um arquivo em formato PDF.' });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    try {
      setStatusMsg(null);
      await onUpload(selectedFile);
      setStatusMsg({ type: 'success', text: 'Fatura importada e lida com sucesso!' });
      setTimeout(() => {
        onClose();
        setSelectedFile(null);
        setStatusMsg(null);
      }, 1200);
    } catch {
      setStatusMsg({ type: 'error', text: 'Erro ao processar o arquivo. Verifique o PDF e tente novamente.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Adicionar Nova Fatura
              </h3>
              <p className="text-xs text-slate-400">
                Importe e processe um documento PDF automaticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-white/15 bg-slate-900/50 hover:border-indigo-500/50'
          }`}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
            <FileText className="w-10 h-10 text-indigo-400 mb-1" />
            <p className="text-sm font-semibold text-white">
              {selectedFile ? selectedFile.name : 'Solte o arquivo PDF aqui'}
            </p>
            <p className="text-xs text-slate-400">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB selecionado`
                : 'Ou clique para navegar nos seus arquivos'}
            </p>
          </div>
        </div>

        {/* Feedback message */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
          >
            {isUploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{isUploading ? 'Processando...' : 'Ler e Processar Fatura'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
