"use client";

import { useToastStore } from "@/src/store/Usetoaststore";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import React from "react";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: any;
  onClose: () => void;
}

function Toast({ toast, onClose }: ToastProps) {
  React.useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(onClose, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          icon: <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />,
          text: "text-green-700",
          title: "text-green-800 font-semibold",
        };
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
          text: "text-red-700",
          title: "text-red-800 font-semibold",
        };
      case "warning":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />,
          text: "text-yellow-700",
          title: "text-yellow-800 font-semibold",
        };
      case "info":
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
          text: "text-blue-700",
          title: "text-blue-800 font-semibold",
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`pointer-events-auto max-w-md rounded-2xl border ${styles.bg} ${styles.border} p-4 shadow-lg animate-in slide-in-from-top-4 fade-in`}
    >
      <div className="flex gap-3">
        {styles.icon}
        <div className="flex-1 min-w-0">
          <p className={styles.title}>
            {toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}
          </p>
          <p className={`text-sm ${styles.text} break-words`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}