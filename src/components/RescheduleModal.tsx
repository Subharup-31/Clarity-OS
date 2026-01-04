import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { X, Calendar as CalendarIcon, Sunrise, ArrowRight } from 'lucide-react-native';
import {
    format,
    addDays,
    startOfToday,
    addWeeks,
    startOfMonth,
    endOfMonth,
    getDay,
    eachDayOfInterval,
    isSameDay,
    isSameMonth,
    addMonths
} from 'date-fns';

interface RescheduleModalProps {
    visible: boolean;
    onClose: () => void;
    onReschedule: (date: Date) => void;
    rescheduleCount?: number; // To show warning if postponed many times
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const RescheduleModal: React.FC<RescheduleModalProps> = ({ visible, onClose, onReschedule, rescheduleCount = 0 }) => {
    const { colors, spacing } = useTheme();
    const today = startOfToday();
    const currentMonth = today;

    // Generate calendar grid for current month + next month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(addMonths(currentMonth, 1)); // Show 2 months

    // Get all days from start of current month to end of next month
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Calculate leading empty cells (days before the 1st of the month)
    const startDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.

    // Show warning if rescheduled 3+ times
    const showWarning = rescheduleCount >= 3;

    const handleSelect = (date: Date) => {
        onReschedule(date);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <CalendarIcon color={colors.primary} size={20} />
                            <Text style={[styles.title, { color: colors.textPrimary }]}>Reschedule</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <X color={colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Warning for frequently rescheduled tasks */}
                    {showWarning && (
                        <View style={[styles.warningBanner, { backgroundColor: colors.danger + '20', borderColor: colors.danger }]}>
                            <Text style={[styles.warningText, { color: colors.danger }]}>
                                ⚠️ This task has been postponed {rescheduleCount} times. Is it still relevant?
                            </Text>
                        </View>
                    )}

                    {/* Quick Options */}
                    <View style={styles.quickOptions}>
                        <TouchableOpacity
                            style={[styles.quickBtn, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                            onPress={() => handleSelect(addDays(today, 1))}
                        >
                            <Sunrise color={colors.primary} size={18} />
                            <Text style={[styles.quickText, { color: colors.primary }]}>Tomorrow</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                            onPress={() => handleSelect(addWeeks(today, 1))}
                        >
                            <ArrowRight color={colors.textSecondary} size={18} />
                            <Text style={[styles.quickText, { color: colors.textSecondary }]}>Next Week</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Weekday Header */}
                        <View style={styles.weekdayRow}>
                            {WEEKDAYS.map((day) => (
                                <View key={day} style={styles.weekdayCell}>
                                    <Text style={[styles.weekdayText, { color: colors.textSecondary }]}>
                                        {day}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Calendar Grid */}
                        <View style={styles.grid}>
                            {/* Empty cells for alignment */}
                            {Array.from({ length: startDayOfWeek }).map((_, i) => (
                                <View key={`empty-${i}`} style={styles.dayCell} />
                            ))}

                            {/* Actual days */}
                            {allDays.map((date, index) => {
                                const dayNum = format(date, 'd');
                                const isToday = isSameDay(date, today);
                                const isPast = date < today && !isToday;
                                const isCurrentMonth = isSameMonth(date, today);
                                const isNextMonth = !isCurrentMonth && isSameMonth(date, addMonths(today, 1));
                                const showMonthLabel = dayNum === '1'; // Show month name on 1st of each month

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.dayCell}
                                        onPress={() => !isPast && handleSelect(date)}
                                        disabled={isPast}
                                    >
                                        <View style={[
                                            styles.dayBox,
                                            {
                                                backgroundColor: isToday
                                                    ? colors.primary
                                                    : isPast
                                                        ? 'transparent'
                                                        : colors.background,
                                                borderColor: isToday
                                                    ? colors.primary
                                                    : isPast
                                                        ? 'transparent'
                                                        : isNextMonth
                                                            ? colors.border + '60'
                                                            : colors.border,
                                                borderWidth: isPast ? 0 : 1,
                                                opacity: isPast ? 0.3 : isNextMonth ? 0.7 : 1,
                                            }
                                        ]}>
                                            <Text style={[
                                                styles.dayText,
                                                {
                                                    color: isToday
                                                        ? '#fff'
                                                        : isPast
                                                            ? colors.textSecondary
                                                            : isNextMonth
                                                                ? colors.textSecondary
                                                                : colors.textPrimary
                                                }
                                            ]}>
                                                {dayNum}
                                            </Text>
                                        </View>
                                        {showMonthLabel && (
                                            <Text style={[styles.monthLabel, { color: colors.primary }]}>
                                                {format(date, 'MMM')}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderBottomWidth: 0,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '75%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    quickOptions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    quickBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
    },
    quickText: {
        fontWeight: '600',
        fontSize: 14,
    },
    weekdayRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekdayCell: {
        flex: 1,
        alignItems: 'center',
    },
    weekdayText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%', // 100% / 7 days
        alignItems: 'center',
        marginBottom: 8,
        minHeight: 50,
    },
    dayBox: {
        width: 38,
        height: 38,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 15,
        fontWeight: '600',
    },
    monthLabel: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    warningBanner: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
    },
    warningText: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
});
