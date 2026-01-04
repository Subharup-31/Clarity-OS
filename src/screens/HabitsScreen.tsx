import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useGame } from '../context/GameContext';
import { useSelectedDate } from '../context/DateContext';
import { HabitCard } from '../components/HabitCard';
import { useTheme } from '../hooks/useTheme';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { Task, Habit } from '../types';
import { EmptyState } from '../components/EmptyState';
import { startOfDay } from 'date-fns';

export const HabitsScreen = () => {
    const { state, dispatch } = useGame();
    const { colors, spacing } = useTheme();
    const { selectedDate, isToday, isReadOnly } = useSelectedDate();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Filter habits based on selected date
    const filteredHabits = useMemo(() => {
        const selectedDayStart = startOfDay(selectedDate).getTime();
        const selectedDayEnd = selectedDayStart + 24 * 60 * 60 * 1000 - 1;

        return state.habits.filter((habit: Habit) => {
            const wasCreatedBefore = habit.createdAt <= selectedDayEnd;
            const notDeletedYet = !habit.deletedAt || habit.deletedAt > selectedDayEnd;
            return wasCreatedBefore && notDeletedYet;
        });
    }, [state.habits, selectedDate]);

    const handleScoreHabit = (id: string, direction: 'positive' | 'negative') => {
        if (isReadOnly) return;
        dispatch({ type: 'SCORE_HABIT', payload: { id, direction } });
    };

    return (
        <View style={[styles.container, { paddingHorizontal: spacing.m }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Daily routine</Text>
            <FlatList
                data={filteredHabits}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => !isReadOnly && setSelectedTask(item)}
                        activeOpacity={isReadOnly ? 1 : 0.7}
                    >
                        <HabitCard
                            habit={item}
                            onPositive={() => handleScoreHabit(item.id, 'positive')}
                            onNegative={() => handleScoreHabit(item.id, 'negative')}
                            disabled={isReadOnly}
                        />
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 140, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={filteredHabits.length > 0}
                ListEmptyComponent={<EmptyState type="habit" />}
            />

            <TaskDetailModal
                visible={!!selectedTask && !isReadOnly}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdate={(id, data) => dispatch({ type: 'UPDATE_TASK', payload: { id, data } })}
                onDelete={(id, type) => dispatch({ type: 'SOFT_DELETE_TASK', payload: { id, type } })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sectionTitle: {
        fontWeight: 'bold',
        fontSize: 18,
    },
});
