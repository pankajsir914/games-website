import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MatchCardSkeletonProps {
  isLandscape?: boolean;
}

export function MatchCardSkeleton({ isLandscape = false }: MatchCardSkeletonProps) {
  return (
    <Card className={`relative overflow-hidden border-0 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-md shadow-lg ${isLandscape ? 'h-56' : ''}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3" />
      <div className="absolute inset-[1px] bg-card rounded-lg" />
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {isLandscape ? (
          // Landscape Layout Skeleton
          <div className="flex h-full">
            {/* Left Section - Match Info */}
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            </div>

            {/* Center Section - Teams and Scores */}
            <div className="flex-[1.2] p-5 flex flex-col justify-center">
              <div className="space-y-4">
                {/* Home Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-8 w-8 ml-auto" />
                    <Skeleton className="h-3 w-12 ml-auto" />
                  </div>
                </div>
                
                {/* VS Divider */}
                <div className="flex items-center justify-center my-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <Skeleton className="mx-3 w-8 h-6 rounded-full" />
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </div>
                
                {/* Away Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-8 w-8 ml-auto" />
                    <Skeleton className="h-3 w-12 ml-auto" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Betting */}
            <div className="w-48 p-4 border-l border-border/30 bg-gradient-to-b from-muted/20 to-muted/10">
              <Skeleton className="w-full h-8" />
            </div>
          </div>
        ) : (
          // Portrait Layout Skeleton
          <>
            <CardHeader className="pb-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-5 space-y-5">
                {/* Home Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-10 w-10 ml-auto" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>
                </div>
                
                {/* VS divider */}
                <div className="flex items-center justify-center my-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <Skeleton className="mx-4 w-12 h-8 rounded-full" />
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </div>
                
                {/* Away Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-10 w-10 ml-auto" />
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </CardContent>
          </>
        )}
      </div>
    </Card>
  );
}