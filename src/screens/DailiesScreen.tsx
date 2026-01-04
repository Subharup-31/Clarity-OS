import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useGame } from '../context/GameContext';
import { useSelectedDate } from '../context/DateContext';
import { TaskCard } from '../components/TaskCard';
import { useTheme } from '../hooks/useTheme';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { Task, Daily } from '../types';
import { EmptyState } from '../components/EmptyState';
import { startOfDay } from 'date-fns';

export const DailiesScreen = () => {
    const { state, dispatch } = useGame();
    const { colors, spacing } = useTheme();
    const { selectedDate, isToday, isReadOnly } = useSelectedDate();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Filter dailies based on selected date
    const filteredDailies = useMemo(() => {
        const selectedDayStart = startOfDay(selectedDate).getTime();
        const selectedDayEnd = selectedDayStart + 24 * 60 * 60 * 1000 - 1;

        return state.dailies.filter((daily: Daily) => {
            const wasCreatedBefore = daily.createdAt <= selectedDayEnd;
            const notDeletedYet = !daily.deletedAt || daily.deletedAt > selectedDayEnd;
            return wasCreatedBefore && notDeletedYet;
        });
    }, [state.dailies, selectedDate]);

    const handleToggleDaily = (id: string) => {
        if (isReadOnly) return;
        dispatch({ type: 'TOGGLE_DAILY', payload: id });
    };

    return (
        <View style={[styles.container, { paddingHorizontal: spacing.m }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Your Dailies</Text>
            <FlatList
                data={filteredDailies}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => !isReadOnly && setSelectedTask(item)}
                        activeOpacity={isReadOnly ? 1 : 0.7}
                    >
                        <TaskCard
                            task={item}
                            onToggle={() => handleToggleDaily(item.id)}
                            disabled={isReadOnly}
                        />
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 140, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={filteredDailies.length > 0}
                ListEmptyComponent={<EmptyState type="daily" />}
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
