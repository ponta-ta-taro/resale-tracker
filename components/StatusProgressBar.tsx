'use client';

import { INVENTORY_STATUSES, STATUS_V2_LABELS, type InventoryV2Status } from '@/types';

interface StatusProgressBarProps {
    currentStatus: InventoryV2Status;
}

export default function StatusProgressBar({ currentStatus }: StatusProgressBarProps) {
    const currentIndex = INVENTORY_STATUSES.indexOf(currentStatus);

    return (
        <div className="w-full py-6">
            {/* Top row: Circles and connecting lines */}
            <div className="flex items-center justify-between mb-3">
                {INVENTORY_STATUSES.map((status, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                        <div key={status} className="flex-1 flex items-center">
                            {/* Step Circle */}
                            <div className="flex justify-center flex-1">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${isCompleted
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-400'
                                        } ${isCurrent ? 'ring-4 ring-blue-200' : ''}`}
                                >
                                    {index + 1}
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < INVENTORY_STATUSES.length - 1 && (
                                <div
                                    className={`h-1 flex-1 transition-colors ${index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom row: Labels */}
            <div className="flex items-start justify-between">
                {INVENTORY_STATUSES.map((status, index) => {
                    const isCompleted = index <= currentIndex;

                    return (
                        <div key={`label-${status}`} className="flex-1 flex items-center">
                            <div className="flex-1 text-center">
                                <div
                                    className={`text-xs font-medium ${isCompleted ? 'text-blue-600' : 'text-gray-400'
                                        }`}
                                >
                                    {STATUS_V2_LABELS[status]}
                                </div>
                            </div>
                            {/* Empty space for connector line alignment */}
                            {index < INVENTORY_STATUSES.length - 1 && (
                                <div className="flex-1" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
