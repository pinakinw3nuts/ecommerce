"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext<{
  selectedValue: string;
  onChange: (value: string) => void;
} | null>(null);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, value, onValueChange, className, children, ...props }, ref) => {
    const [selectedValue, setSelectedValue] = React.useState(value || defaultValue);

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    const onChange = React.useCallback(
      (value: string) => {
        setSelectedValue(value);
        onValueChange?.(value);
      },
      [onValueChange]
    );

    return (
      <TabsContext.Provider value={{ selectedValue, onChange }}>
        <div ref={ref} className={cn("", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const isSelected = context.selectedValue === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isSelected}
        className={cn(
          "px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none",
          isSelected
            ? "border-b-2 border-[#D23F57] text-[#D23F57]"
            : "text-gray-500 hover:text-gray-700 hover:border-gray-300",
          className
        )}
        onClick={() => context.onChange(value)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  forceMount?: boolean;
  children: React.ReactNode;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, forceMount, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    const isSelected = context.selectedValue === value;

    // Always render the content but hide it when not selected
    return (
      <div
        ref={ref}
        role="tabpanel"
        aria-hidden={!isSelected}
        className={cn(
          "outline-none",
          isSelected ? "block" : "hidden",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent }; 