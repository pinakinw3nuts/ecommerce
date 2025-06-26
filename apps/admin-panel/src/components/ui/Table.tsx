import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { responsive?: boolean }
>(({ className, responsive = true, ...props }, ref) => (
  <div className={cn(
    "relative w-full", 
    responsive ? "overflow-auto" : ""
  )}>
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b sticky top-0 bg-white z-10", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-2 md:px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 whitespace-nowrap",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-2 md:p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

// New component for responsive card-style tables on mobile
const ResponsiveTable = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    headers: string[];
    mobileBreakpoint?: string;
  }
>(({ className, headers, mobileBreakpoint = "md", children, ...props }, ref) => {
  const breakpointClass = `${mobileBreakpoint}:hidden`;
  
  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      {/* Regular table for desktop */}
      <div className={`hidden ${mobileBreakpoint}:block overflow-x-auto`}>
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, i) => (
                    <TableHead key={i}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {children}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {/* Card layout for mobile */}
      <div className={`block ${mobileBreakpoint}:hidden space-y-4`}>
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          
          // Extract cells from the row
          const cells = React.Children.toArray(child.props.children);
          
          return (
            <div className="bg-white border rounded-lg shadow-sm p-4">
              {React.Children.map(cells, (cell, i) => {
                if (!React.isValidElement(cell) || i >= headers.length) return null;
                
                return (
                  <div className="flex justify-between py-2 border-b last:border-0">
                    <span className="font-medium text-gray-500">{headers[i]}</span>
                    <div className="text-right ml-4">{cell.props.children}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
});
ResponsiveTable.displayName = "ResponsiveTable";

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ResponsiveTable
} 