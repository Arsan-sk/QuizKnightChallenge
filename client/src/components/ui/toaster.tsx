import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Sparkles } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const getIcon = () => {
          if (variant === "success") return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
          if (variant === "destructive") return <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />;
          if (variant === "warning") return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
          if (variant === "info") return <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />;
          return <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />;
        };

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              {getIcon()}
              <div className="grid gap-1">
                {title && <ToastTitle className="text-white font-bold">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-zinc-300 text-xs leading-relaxed">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="text-zinc-400 hover:text-white" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
