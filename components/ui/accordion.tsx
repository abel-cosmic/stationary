"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionContextValue {
  open: boolean
  onToggle: () => void
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(
  undefined
)

const useAccordion = () => {
  const context = React.useContext(AccordionContext)
  if (!context) {
    throw new Error("Accordion components must be used within Accordion")
  }
  return context
}

interface AccordionProps {
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

function Accordion({ children, defaultOpen = false, className }: AccordionProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <AccordionContext.Provider value={{ open, onToggle: () => setOpen(!open) }}>
      <div className={cn("w-full", className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ children, className, ...props }, ref) => {
    const { open, onToggle } = useAccordion()

    return (
      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between py-3 px-4 font-medium transition-all hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        data-state={open ? "open" : "closed"}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </button>
    )
  }
)
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionContentProps {
  children: React.ReactNode
  className?: string
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, className }, ref) => {
    const { open } = useAccordion()

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden text-sm transition-all duration-200 ease-in-out",
          open ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
      </div>
    )
  }
)
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionTrigger, AccordionContent }
