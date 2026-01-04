import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { format, isSameDay, startOfDay, isAfter, isBefore } from 'date-fns';
import { AppState, AppStateStatus } from 'react-native';

interface DateContextType {
    selectedDate: Date;
    selectedDateStr: string; // YYYY-MM-DD format for comparisons
    isToday: boolean;
    isPastDate: boolean;
    isFutureDate: boolean;
    isReadOnly: boolean; // true for past and future dates
    setSelectedDate: (date: Date) => void;
    resetToToday: () => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export const DateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedDate, setSelectedDateState] = useState<Date>(startOfDay(new Date()));
    // CRITICAL FIX: today must be state, not memoized, so it updates on day change
    const [today, setToday] = useState<Date>(startOfDay(new Date()));

    // Update today when app becomes active (handles midnight crossing)
    useEffect(() => {
        const checkAndUpdateToday = () => {
            const now = startOfDay(new Date());
            if (!isSameDay(now, today)) {
                setToday(now);
            }
        };

        // Check immediately
        checkAndUpdateToday();

        // Check when app comes to foreground
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                checkAndUpdateToday();
            }
        });

        // Also check every minute to catch midnight while app is active
        const interval = setInterval(checkAndUpdateToday, 60000);

        return () => {
            subscription.remove();
            clearInterval(interval);
        };
    }, [today]);

    const value = useMemo(() => {
        const normalizedSelected = startOfDay(selectedDate);
        const isToday = isSameDay(normalizedSelected, today);
        const isPastDate = isBefore(normalizedSelected, today);
        const isFutureDate = isAfter(normalizedSelected, today);

        return {
            selectedDate: normalizedSelected,
            selectedDateStr: format(normalizedSelected, 'yyyy-MM-dd'),
            isToday,
            isPastDate,
            isFutureDate,
            isReadOnly: isPastDate || isFutureDate, // Only today is editable
            setSelectedDate: (date: Date) => setSelectedDateState(startOfDay(date)),
            resetToToday: () => setSelectedDateState(startOfDay(new Date())),
        };
    }, [selectedDate, today]);

    return (
        <DateContext.Provider value={value}>
            {children}
        </DateContext.Provider>
    );
};

export const useSelectedDate = (): DateContextType => {
    const context = useContext(DateContext);
    if (!context) {
        throw new Error('useSelectedDate must be used within a DateProvider');
    }
    return context;
};

