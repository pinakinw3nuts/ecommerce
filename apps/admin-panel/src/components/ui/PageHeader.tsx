'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { LucideIcon, MoreVertical } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    priority?: 'high' | 'medium' | 'low'; // For mobile display priority
  }[];
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  // Sort actions by priority for mobile display
  const sortedActions = actions?.slice().sort((a, b) => {
    const priorityMap = { high: 0, medium: 1, low: 2 };
    const aPriority = a.priority || 'medium';
    const bPriority = b.priority || 'medium';
    return priorityMap[aPriority] - priorityMap[bPriority];
  });

  // Only show the first action on mobile, rest go in dropdown
  const primaryAction = sortedActions && sortedActions.length > 0 ? sortedActions[0] : null;
  const secondaryActions = sortedActions && sortedActions.length > 1 
    ? sortedActions.slice(1) 
    : [];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-gray-200">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
        )}
      </div>
      
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {/* Primary action always visible */}
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant={primaryAction.variant || 'default'}
              className="flex-1 sm:flex-none justify-center"
            >
              {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
              {primaryAction.label}
            </Button>
          )}
          
          {/* Secondary actions in dropdown on mobile */}
          {secondaryActions.length > 0 && (
            <>
              {/* Show buttons on desktop */}
              <div className="hidden sm:flex items-center gap-2">
                {secondaryActions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    variant={action.variant || 'outline'}
                  >
                    {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </Button>
                ))}
              </div>
              
              {/* Show dropdown on mobile */}
              <div className="block sm:hidden">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0">
                    <div className="py-1">
                      {secondaryActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.onClick}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 