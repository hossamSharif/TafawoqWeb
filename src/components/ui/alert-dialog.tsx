'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button'

interface AlertDialogContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextType | undefined>(undefined)

function useAlertDialogContext() {
  const context = React.useContext(AlertDialogContext)
  if (!context) {
    throw new Error('AlertDialog components must be used within an AlertDialog')
  }
  return context
}

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function AlertDialog({ open: controlledOpen, onOpenChange, children }: AlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isControlled, onOpenChange])

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

interface AlertDialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const AlertDialogTrigger = React.forwardRef<HTMLButtonElement, AlertDialogTriggerProps>(
  ({ asChild: _asChild, onClick, children, ...props }, ref) => {
    const { setOpen } = useAlertDialogContext()

    return (
      <button
        ref={ref}
        onClick={(e) => {
          setOpen(true)
          onClick?.(e)
        }}
        {...props}
      >
        {children}
      </button>
    )
  }
)
AlertDialogTrigger.displayName = 'AlertDialogTrigger'

interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useAlertDialogContext()

    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
      }

      return () => {
        document.body.style.overflow = ''
      }
    }, [open])

    if (!open) return null

    return (
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/80 animate-in fade-in-0" />

        {/* Content */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div
            ref={ref}
            className={cn(
              'relative w-full max-w-lg bg-background rounded-lg shadow-lg p-6',
              'animate-in fade-in-0 zoom-in-95',
              className
            )}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            {...props}
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
AlertDialogContent.displayName = 'AlertDialogContent'

const AlertDialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-2 text-center sm:text-right', className)}
      {...props}
    />
  )
)
AlertDialogHeader.displayName = 'AlertDialogHeader'

const AlertDialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 sm:space-x-reverse mt-4', className)}
      {...props}
    />
  )
)
AlertDialogFooter.displayName = 'AlertDialogFooter'

const AlertDialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
)
AlertDialogTitle.displayName = 'AlertDialogTitle'

const AlertDialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
AlertDialogDescription.displayName = 'AlertDialogDescription'

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AlertDialogAction = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  ({ className, onClick, ...props }, ref) => {
    const { setOpen } = useAlertDialogContext()

    return (
      <button
        ref={ref}
        className={cn(buttonVariants(), className)}
        onClick={(e) => {
          onClick?.(e)
          setOpen(false)
        }}
        {...props}
      />
    )
  }
)
AlertDialogAction.displayName = 'AlertDialogAction'

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AlertDialogCancel = React.forwardRef<HTMLButtonElement, AlertDialogCancelProps>(
  ({ className, onClick, ...props }, ref) => {
    const { setOpen } = useAlertDialogContext()

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', className)}
        onClick={(e) => {
          onClick?.(e)
          setOpen(false)
        }}
        {...props}
      />
    )
  }
)
AlertDialogCancel.displayName = 'AlertDialogCancel'

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
