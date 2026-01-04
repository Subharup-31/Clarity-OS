import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useGame } from '../context/GameContext';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { RADIUS, TEXT_STYLES } from '../constants/tokens';
import { format, subDays, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';

interface WeeklyReviewModalProps {
    visible: boolean;
    onClose: () => void;
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({ visible, onClose }) => {
    const { colors } = useTheme();
    const { state } = useGame();
    const insets = useSafeAreaInsets();

    // Calculate weekly stats
    const stats = useMemo(() => {
        const today = startOfDay(new Date());
        const thisWeekStart = subDays(today, 6); // Last 7 days including today
        const lastWeekStart = subDays(today, 13);
        const lastWeekEnd = subDays(today, 7);

        // This week's stats
        let thisWeekCompleted = 0;
        let thisWeekTotal = 0;
        let thisWeekGold = 0;
        let thisWeekXp = 0;

        // Last week's stats
        let lastWeekGold = 0;
        let lastWeekXp = 0;

        Object.entries(state.dailyStats).forEach(([dateStr, stat]) => {
            const date = parseISO(dateStr);

            // This week
            if (!isBefore(date, thisWeekStart) && !isAfter(date, today)) {
                thisWeekCompleted += stat.completedPositive;
                thisWeekTotal += stat.totalPositive;
                thisWeekGold += stat.goldEarned;
                thisWeekXp += stat.xpEarned;
            }

            // Last week
            if (!isBefore(date, lastWeekStart) && !isAfter(date, lastWeekEnd)) {
                lastWeekGold += stat.goldEarned;
                lastWeekXp += stat.xpEarned;
            }
        });

        // Calculate habit completion rates
        const habitStats: { id: string; title: string; rate: number }[] = state.habits.map(habit => {
            const positive = habit.countPositive || 0;
            const negative = habit.countNegative || 0;
            const total = positive + negative;
            const rate = total > 0 ? positive / total : 0;
            return { id: habit.id, title: habit.title, rate };
        });

        const bestHabit = habitStats.length > 0
            ? habitStats.reduce((a, b) => a.rate > b.rate ? a : b)
            : null;

        const worstHabit = habitStats.length > 0
            ? habitStats.reduce((a, b) => a.rate < b.rate ? a : b)
            : null;

        const completionRate = thisWeekTotal > 0
            ? Math.round((thisWeekCompleted / thisWeekTotal) * 100)
            : 0;

        const goldDiff = thisWeekGold - lastWeekGold;
        const xpDiff = thisWeekXp - lastWeekXp;

        return {
            completionRate,
            thisWeekGold,
            thisWeekXp,
            goldDiff,
            xpDiff,
            bestHabit,
            worstHabit,
            hasData: thisWeekTotal > 0 || habitStats.length > 0,
        };
    }, [state.dailyStats, state.habits]);

    const TrendIcon = ({ diff }: { diff: number }) => {
        if (diff > 0) return <TrendingUp size={14} color={colors.positive} />;
        if (diff < 0) return <TrendingDown size={14} color={colors.negative} />;
        return <Minus size={14} color={colors.textSecondary} />;
    };

    const formatDiff = (diff: number) => {
        if (diff > 0) return `+${diff}`;
        return diff.toString();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.cardBg, paddingBottom: insets.bottom + 20 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>Weekly Review</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X color={colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {!stats.hasData ? (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No data yet. Complete some tasks to see your weekly review.
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* 7-Day Completion */}
                                <View style={[styles.card, { backgroundColor: colors.background }]}>
                                    <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                                        7-DAY COMPLETION
                                    </Text>
                                    <Text style={[styles.bigNumber, { color: colors.primary }]}>
                                        {stats.completionRate}%
                                    </Text>
                                </View>

                                {/* Best / Worst Habits */}
                                <View style={styles.row}>
                                    <View style={[styles.card, styles.halfCard, { backgroundColor: colors.background }]}>
                                        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                                            STRONGEST HABIT
                                        </Text>
                                        <Text style={[styles.habitName, { color: colors.positive }]} numberOfLines={2}>
                                            {stats.bestHabit?.title || 'No data'}
                                        </Text>
                                        {stats.bestHabit && (
                                            <Text style={[styles.habitRate, { color: colors.textSecondary }]}>
                                                {Math.round(stats.bestHabit.rate * 100)}% positive
                                            </Text>
                                        )}
                                    </View>

                                    <View style={[styles.card, styles.halfCard, { backgroundColor: colors.background }]}>
                                        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                                            NEEDS ATTENTION
                                        </Text>
                                        <Text style={[styles.habitName, { color: colors.neutral }]} numberOfLines={2}>
                                            {stats.worstHabit?.title || 'No data'}
                                        </Text>
                                        {stats.worstHabit && (
                                            <Text style={[styles.habitRate, { color: colors.textSecondary }]}>
                                                {Math.round(stats.worstHabit.rate * 100)}% positive
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {/* Gold / XP Comparison */}
                                <View style={styles.row}>
                                    <View style={[styles.card, styles.halfCard, { backgroundColor: colors.background }]}>
                                        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                                            GOLD THIS WEEK
                                        </Text>
                                        <Text style={[styles.statValue, { color: colors.gold }]}>
                                            {stats.thisWeekGold}
                                        </Text>
                                        <View style={styles.diffRow}>
                                            <TrendIcon diff={stats.goldDiff} />
                                            <Text style={[styles.diffText, {
                                                color: stats.goldDiff > 0 ? colors.positive :
                                                    stats.goldDiff < 0 ? colors.negative : colors.textSecondary
                                            }]}>
                                                {formatDiff(stats.goldDiff)} vs last week
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.card, styles.halfCard, { backgroundColor: colors.background }]}>
                                        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                                            XP THIS WEEK
                                        </Text>
                                        <Text style={[styles.statValue, { color: colors.xp }]}>
                                            {stats.thisWeekXp}
                                        </Text>
                                        <View style={styles.diffRow}>
                                            <TrendIcon diff={stats.xpDiff} />
                                            <Text style={[styles.diffText, {
                                                color: stats.xpDiff > 0 ? colors.positive :
                                                    stats.xpDiff < 0 ? colors.negative : colors.textSecondary
                                            }]}>
                                                {formatDiff(stats.xpDiff)} vs last week
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: 20,
        maxHeight: '75%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        ...TEXT_STYLES.h2,
        fontFamily: 'Inter_700Bold',
    },
    content: {
        flex: 1,
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyText: {
        ...TEXT_STYLES.body,
        fontFamily: 'Inter_400Regular',
        textAlign: 'center',
    },
    card: {
        padding: 16,
        borderRadius: RADIUS.md,
        marginBottom: 12,
    },
    halfCard: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    cardLabel: {
        ...TEXT_STYLES.label,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 8,
    },
    bigNumber: {
        fontSize: 48,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
    },
    habitName: {
        ...TEXT_STYLES.bodyBold,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 4,
    },
    habitRate: {
        ...TEXT_STYLES.caption,
        fontFamily: 'Inter_400Regular',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'Inter_700Bold',
        marginBottom: 4,
    },
    diffRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    diffText: {
        ...TEXT_STYLES.caption,
        fontFamily: 'Inter_400Regular',
    },
});
