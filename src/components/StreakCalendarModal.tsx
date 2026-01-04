import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useGame } from '../context/GameContext';
import { useSelectedDate } from '../context/DateContext';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
    format,
    subMonths,
    addMonths,
    eachDayOfInterval,
    startOfMonth,
    endOfMonth,
    isSameDay,
    isSameMonth,
    startOfWeek,
    endOfWeek,
    isBefore,
    isAfter
} from 'date-fns';

interface StreakCalendarModalProps {
    visible: boolean;
    onClose: () => void;
}

export const StreakCalendarModal: React.FC<StreakCalendarModalProps> = ({ visible, onClose }) => {
    const { colors, spacing } = useTheme();
    const { state } = useGame();
    const { setSelectedDate } = useSelectedDate();
    const history = state.history || {};

    const today = new Date();
    const [displayMonth, setDisplayMonth] = useState(today);

    // MEMOIZE: Only recompute days when displayMonth changes
    const days = useMemo(() => {
        const monthStart = startOfMonth(displayMonth);
        const monthEnd = endOfMonth(displayMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [displayMonth]);

    const monthStart = startOfMonth(displayMonth);

    const getDayStatus = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return history[dateStr]?.status; // 'success' | 'fail' | undefined
    };

    const handlePrevMonth = () => {
        setDisplayMonth(prev => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        setDisplayMonth(prev => addMonths(prev, 1));
    };

    const handleDayPress = (date: Date) => {
        setSelectedDate(date);
        onClose();
    };

    const handleGoToToday = () => {
        setDisplayMonth(today);
    };

    const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>Calendar History</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X color={colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Month Navigation */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={handlePrevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <ChevronLeft color={colors.textPrimary} size={28} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleGoToToday}>
                            <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
                                {format(displayMonth, 'MMMM yyyy')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleNextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <ChevronRight color={colors.textPrimary} size={28} />
                        </TouchableOpacity>
                    </View>

                    {/* Week day headers */}
                    <View style={styles.weekDayRow}>
                        {weekDayLabels.map((label, i) => (
                            <Text key={i} style={[styles.weekDayLabel, { color: colors.textSecondary }]}>
                                {label}
                            </Text>
                        ))}
                    </View>

                    {/* Calendar grid */}
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.grid}>
                            {days.map((date, index) => {
                                const status = getDayStatus(date);
                                const isInDisplayMonth = isSameMonth(date, displayMonth);
                                const isToday = isSameDay(date, today);
                                const isFuture = isAfter(date, today);

                                let bgColor = colors.cardBg;
                                if (!isInDisplayMonth) bgColor = 'transparent';
                                else if (status === 'success') bgColor = colors.success;
                                else if (status === 'fail') bgColor = colors.danger;

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.dayContainer}
                                        onPress={() => handleDayPress(date)}
                                        disabled={!isInDisplayMonth}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[
                                            styles.dayBox,
                                            {
                                                backgroundColor: bgColor,
                                                borderColor: isToday ? colors.primary : 'transparent',
                                                borderWidth: isToday ? 2 : 0,
                                                opacity: isInDisplayMonth ? 1 : 0.3
                                            }
                                        ]}>
                                            <Text style={[
                                                styles.dayText,
                                                {
                                                    color: status && isInDisplayMonth ? '#fff' :
                                                        isFuture ? colors.textSecondary :
                                                            colors.textPrimary
                                                }
                                            ]}>
                                                {format(date, 'd')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    {/* Legend */}
                    <View style={[styles.legend, { borderTopColor: colors.border }]}>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: colors.success }]} />
                            <Text style={{ color: colors.textSecondary }}>Complete</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                            <Text style={{ color: colors.textSecondary }}>Missed</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border }]} />
                            <Text style={{ color: colors.textSecondary }}>No data</Text>
                        </View>
                    </View>

                    {/* Hint */}
                    <Text style={[styles.hint, { color: colors.textSecondary }]}>
                        Tap a day to view that date's habits & dailies
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    weekDayRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    weekDayLabel: {
        width: 40,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    dayContainer: {
        width: '14.28%', // 7 columns
        alignItems: 'center',
        marginBottom: 8,
    },
    dayBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    hint: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 12,
        fontStyle: 'italic',
    }
});

