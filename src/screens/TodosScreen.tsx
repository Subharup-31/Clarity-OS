import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useGame } from '../context/GameContext';
import { useSelectedDate } from '../context/DateContext';
import { TaskCard } from '../components/TaskCard';
import { useTheme } from '../hooks/useTheme';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { RescheduleModal } from '../components/RescheduleModal';
import { Task, Todo } from '../types';
import { EmptyState } from '../components/EmptyState';
import { startOfDay, endOfDay, isSameDay } from 'date-fns';

export const TodosScreen = () => {
    const { state, dispatch } = useGame();
    const { colors, spacing } = useTheme();
    const { selectedDate, isToday, isPastDate, isFutureDate, isReadOnly } = useSelectedDate();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [rescheduleTask, setRescheduleTask] = useState<Task | null>(null);

    // Filter todos based on selected date
    const filteredTodos = useMemo(() => {
        const selectedDayStart = startOfDay(selectedDate).getTime();
        const selectedDayEnd = endOfDay(selectedDate).getTime();

        return state.todos.filter((todo: Todo) => {
            if (todo.completed) return false;
            if (!todo.dueDate) return isToday;
            return isSameDay(new Date(todo.dueDate), selectedDate);
        });
    }, [state.todos, selectedDate, isToday]);

    const handleCompleteTodo = (id: string) => {
        if (isFutureDate) return;
        if (isPastDate) return;
        dispatch({ type: 'COMPLETE_TODO', payload: id });
    };

    const handleReschedule = (task: Task) => {
        if (isReadOnly) return;
        setRescheduleTask(task);
    };

    return (
        <View style={[styles.container, { paddingHorizontal: spacing.m }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Quest Log</Text>
            <FlatList
                data={filteredTodos}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => !isReadOnly && setSelectedTask(item)}
                        activeOpacity={isReadOnly ? 1 : 0.7}
                    >
                        <TaskCard
                            task={item}
                            onToggle={() => handleCompleteTodo(item.id)}
                            onReschedule={() => handleReschedule(item)}
                            disabled={isReadOnly}
                        />
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 140, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={filteredTodos.length > 0}
                ListEmptyComponent={<EmptyState type="todo" />}
            />

            <TaskDetailModal
                visible={!!selectedTask && !isReadOnly}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdate={(id, data) => dispatch({ type: 'UPDATE_TASK', payload: { id, data } })}
                onDelete={(id, type) => dispatch({ type: 'DELETE_TASK', payload: { id, type } })}
            />

            <RescheduleModal
                visible={!!rescheduleTask && !isReadOnly}
                onClose={() => setRescheduleTask(null)}
                rescheduleCount={(rescheduleTask as any)?.rescheduleCount || 0}
                onReschedule={(date) => {
                    if (rescheduleTask) {
                        dispatch({
                            type: 'RESCHEDULE_TODO',
                            payload: { id: rescheduleTask.id, newDate: date.getTime() }
                        });
                    }
                }}
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
