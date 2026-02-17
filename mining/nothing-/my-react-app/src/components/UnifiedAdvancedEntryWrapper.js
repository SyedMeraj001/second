import React, { lazy, Suspense } from 'react';
import { LoadingSpinner } from './ProfessionalUX';

const UnifiedAdvancedEntry = lazy(() => import('../modules/UnifiedAdvancedEntry'));

const UnifiedAdvancedEntryWrapper = (props) => {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-8">
                <LoadingSpinner size="lg" color="blue" />
                <span className="ml-3 text-gray-600">Loading Enhanced Data Entry...</span>
            </div>
        }>
            <UnifiedAdvancedEntry {...props} />
        </Suspense>
    );
};

export default UnifiedAdvancedEntryWrapper;
