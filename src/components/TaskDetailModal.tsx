import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Task, TaskType } from '../types';
import { X, Trash2, Save } from 'lucide-react-native';

interface TaskDetailModalProps {
    visible: boolean;
    task: Task | null;
    onClose: () => void;
    onUpdate: (id: string, data: Partial<Task>) => void;
    onDelete: (id: string, type: TaskType) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ visible, task, onClose, onUpdate, onDelete }) => {
    const { colors, spacing, sizes } = useTheme();

    // Local state for editing
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

    // Populate state when task opens
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setNotes(task.notes || '');
            setDifficulty(task.difficulty || 'easy');
        }
    }, [task]);

    if (!task) return null;

    const handleSave = () => {
        if (!title.trim()) return;
        onUpdate(task.id, { title, notes, difficulty });
        onClose();
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        onDelete(task.id, task.type);
                        onClose();
                    }
                }
            ]
        );
    };

    const DifficultyBox = ({ level, label, color }: { level: 'easy' | 'medium' | 'hard', label: string, color: string }) => {
        const isSelected = difficulty === level;
        return (
            <TouchableOpacity
                style={[
                    styles.diffBox,
                    {
                        backgroundColor: isSelected ? color : colors.cardBg,
                        borderColor: isSelected ? color : colors.border,
                        borderWidth: isSelected ? 2 : 1
                    }
                ]}
                onPress={() => setDifficulty(level)}
            >
                <Text style={[
                    styles.diffText,
                    { color: isSelected ? '#fff' : colors.textSecondary, fontWeight: isSelected ? 'bold' : 'normal' }
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: (colors as any).headerBg || colors.cardBg }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Task</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X color={colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        {/* Title */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.cardBg,
                                color: colors.textPrimary,
                                borderColor: colors.border
                            }]}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Task Title"
                            placeholderTextColor={colors.textSecondary}
                        />

                        {/* Notes */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.notesInput, {
                                backgroundColor: colors.cardBg,
                                color: colors.textPrimary,
                                borderColor: colors.border
                            }]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Add notes..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                        />

                        {/* Difficulty */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Difficulty</Text>
                        <View style={styles.diffContainer}>
                            <DifficultyBox level="easy" label="Easy" color={colors.positive} />
                            <DifficultyBox level="medium" label="Medium" color={colors.neutral} />
                            <DifficultyBox level="hard" label="Hard" color={colors.danger} />
                        </View>
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.deleteBtn, { backgroundColor: colors.danger + '20' }]}
                            onPress={handleDelete}
                        >
                            <Trash2 color={colors.danger} size={20} />
                            <Text style={[styles.btnText, { color: colors.danger }]}>Delete</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                            onPress={handleSave}
                        >
                            <Save color="#fff" size={20} />
                            <Text style={[styles.btnText, { color: '#fff' }]}>Save</Text>
                        </TouchableOpacity>
                    </View>
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
        height: '80%',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    input: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 16,
        marginBottom: 24,
    },
    notesInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    diffContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    diffBox: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    diffText: {
        fontSize: 14,
    },
    footer: {
        flexDirection: 'row',
        paddingTop: 16,
        borderTopWidth: 1,
        gap: 16,
    },
    deleteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    btnText: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});
