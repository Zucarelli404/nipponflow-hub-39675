import { toast } from "@/hooks/use-toast";

/**
 * Centralized error handler that logs errors only in development
 * and shows user-friendly messages in production
 */
export const handleError = (error: any, userMessage: string) => {
  // Only log detailed errors in development
  if (import.meta.env.DEV) {
    console.error(error);
  }

  // Show user-friendly error message
  toast({
    title: "Erro",
    description: userMessage,
    variant: "destructive",
  });
};

/**
 * Handles errors with a success flag return for form submissions
 */
export const handleFormError = (error: any, userMessage: string): { error: Error } => {
  handleError(error, userMessage);
  return { error: error as Error };
};
