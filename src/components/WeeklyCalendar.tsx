import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format, addDays, subDays, startOfWeek, isSameDay } from 'date-fns';
import { useTheme } from '../hooks/useTheme';
import { useSelectedDate } from '../context/DateContext';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react-native';

export const WeeklyCalendar = () => {
    const { colors, spacing } = useTheme();
    const { selectedDate, setSelectedDate, isToday, isPastDate, isFutureDate } = useSelectedDate();

    // Track the week being displayed (can be different from selected date)
    const [displayWeekStart, setDisplayWeekStart] = useState(() =>
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );

    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(displayWeekStart, i));
    const today = new Date();

    const handlePrevWeek = () => {
        setDisplayWeekStart(prev => subDays(prev, 7));
    };

    const handleNextWeek = () => {
        setDisplayWeekStart(prev => addDays(prev, 7));
    };

    const handleDayPress = (date: Date) => {
        setSelectedDate(date);
    };

    const handleTodayPress = () => {
        setSelectedDate(new Date());
        setDisplayWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    };

    // Show mode indicator
    const getModeLabel = () => {
        if (isToday) return null;
        if (isPastDate) return 'Viewing Past (Read-only)';
        if (isFutureDate) return 'Viewing Future';
        return null;
    };

    const modeLabel = getModeLabel();

    return (
        <View style={[styles.container, { paddingHorizontal: spacing.m }]}>
            {/* Header with navigation */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePrevWeek} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <ChevronLeft color={colors.textSecondary} size={24} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleTodayPress}>
                    <Text style={[styles.dateTitle, { color: colors.textPrimary }]}>
                        {format(selectedDate, 'EEEE, d MMMM, yyyy')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNextWeek} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <ChevronRight color={colors.textSecondary} size={24} />
                </TouchableOpacity>
            </View>

            {/* Mode indicator with prominent Jump to Today button */}
            {modeLabel && (
                <View style={styles.modeContainer}>
                    <View style={[styles.modeIndicator, { backgroundColor: isPastDate ? colors.border : colors.primary + '30' }]}>
                        <Text style={[styles.modeText, { color: isPastDate ? colors.textSecondary : colors.primary }]}>
                            {modeLabel}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.jumpTodayBtn, { backgroundColor: colors.primary }]}
                        onPress={handleTodayPress}
                        activeOpacity={0.8}
                    >
                        <ArrowLeft color="#fff" size={14} strokeWidth={3} />
                        <Text style={styles.jumpTodayText}>Jump to Today</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Week days */}
            <View style={styles.weekRow}>
                {weekDays.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isTodayDate = isSameDay(date, today);

                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.dayCol}
                            onPress={() => handleDayPress(date)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.dayName, { color: colors.textSecondary }]}>
                                {format(date, 'EEE')}
                            </Text>
                            <View style={[
                                styles.dateCircle,
                                isSelected && { backgroundColor: colors.primary },
                                isTodayDate && !isSelected && { borderWidth: 2, borderColor: colors.primary }
                            ]}>
                                <Text style={[
                                    styles.dateNum,
                                    { color: isSelected ? '#fff' : colors.textPrimary }
                                ]}>
                                    {format(date, 'd')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        opacity: 0.8,
    },
    modeIndicator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    modeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    returnText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayCol: {
        alignItems: 'center',
        gap: 8,
    },
    dayName: {
        fontSize: 12,
        textTransform: 'uppercase',
    },
    dateCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateNum: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    modeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    jumpTodayBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    jumpTodayText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
});

