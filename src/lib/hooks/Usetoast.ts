import { useToastStore } from "@/src/store/Usetoaststore";

/**
 * Hook to easily show toast notifications
 * 
 * Usage:
 * const toast = useToast();
 * toast.success("Profile updated!");
 * toast.error("Failed to save");
 * toast.warning("This is deprecated");
 * toast.info("Just so you know");
 */
export function useToast() {
  const { addToast } = useToastStore();

  return {
    success: (message: string, duration?: number) => 
      addToast('success', message, duration),
    
    error: (message: string, duration?: number) => 
      addToast('error', message, duration),
    
    warning: (message: string, duration?: number) => 
      addToast('warning', message, duration),
    
    info: (message: string, duration?: number) => 
      addToast('info', message, duration),
  };
}