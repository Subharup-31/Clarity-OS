import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, KeyboardEvent, InteractionManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, CheckCircle2, Zap, Trophy, Plus, Minus, Calendar, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { TaskType, BehaviorType } from '../types';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { RADIUS, TEXT_STYLES, TOUCH } from '../constants/tokens';
import { format, addDays, startOfToday } from 'date-fns';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (type: 'habit' | 'daily' | 'todo', title: string, notes?: string, behaviorType?: BehaviorType, dueDate?: number) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ visible, onClose, onAdd }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);
    const notesFocusedRef = useRef(false);
    const [type, setType] = useState<'habit' | 'daily' | 'todo'>('habit');
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [behaviorType, setBehaviorType] = useState<BehaviorType>('positive');
    const [dueDate, setDueDate] = useState<Date>(startOfToday());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Track keyboard height for proper modal positioning
    const keyboardHeight = useSharedValue(0);

    // Helper function for scrolling (required for runOnJS - needs named function reference)
    const scrollToEnd = () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    };

    // Handle keyboard show AND hide events properly
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSubscription = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
            const shouldScrollToEnd = notesFocusedRef.current;

            // Update keyboard height when keyboard appears
            // Use callback to scroll after animation completes
            keyboardHeight.value = withTiming(
                e.endCoordinates.height,
                { duration: 250 },
                (finished) => {
                    'worklet';
                    // Scroll to end if notes field triggered the keyboard
                    if (finished && shouldScrollToEnd) {
                        runOnJS(scrollToEnd)();
                    }
                }
            );
        });

        const hideSubscription = Keyboard.addListener(hideEvent, () => {
            // Reset keyboard height to 0 when keyboard hides
            keyboardHeight.value = withTiming(0, { duration: 200 });
            // Also scroll back to top
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            // Reset focus tracking
            notesFocusedRef.current = false;
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [keyboardHeight]);

    const buttonScale = useSharedValue(1);

    const handleAdd = () => {
        if (!title.trim()) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        buttonScale.value = withSequence(
            withSpring(0.95, { damping: 10 }),
            withSpring(1, { damping: 12 })
        );

        const dueDateMs = type === 'todo' ? dueDate.getTime() : undefined;
        onAdd(type, title.trim(), notes.trim() || undefined, type !== 'todo' ? behaviorType : undefined, dueDateMs);
        setTitle('');
        setNotes('');
        setType('habit');
        setBehaviorType('positive');
        setDueDate(startOfToday());
        onClose();
    };

    const handleClose = () => {
        Keyboard.dismiss();
        onClose();
    };

    const handleTypeSelect = (t: 'habit' | 'daily' | 'todo') => {
        Haptics.selectionAsync();
        setType(t);
        // Reset to positive when switching types
        if (t === 'todo') setBehaviorType('positive');
    };

    const handleBehaviorSelect = (b: BehaviorType) => {
        Haptics.selectionAsync();
        setBehaviorType(b);
    };

    const buttonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }]
    }));

    // Animated style for container to handle keyboard offset
    const containerAnimatedStyle = useAnimatedStyle(() => ({
        paddingBottom: Math.max(insets.bottom + 20, 40) + keyboardHeight.value
    }));

    const typeConfig = {
        habit: { icon: Zap, label: 'Habit' },
        daily: { icon: CheckCircle2, label: 'Daily' },
        todo: { icon: Trophy, label: 'Quest' },
    };

    const showBehaviorSelector = type === 'habit'; // Only habits have positive/negative types

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <Animated.View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }, containerAnimatedStyle]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>New Quest</Text>
                        <TouchableOpacity
                            onPress={handleClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.closeBtn}
                        >
                            <X color={colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Type Selector */}
                        <View style={styles.typeSelector}>
                            {(['habit', 'daily', 'todo'] as const).map((t) => {
                                const Icon = typeConfig[t].icon;
                                const isSelected = type === t;

                                return (
                                    <TouchableOpacity
                                        key={t}
                                        style={[
                                            styles.typeBtn,
                                            {
                                                borderColor: isSelected ? colors.primary : colors.border,
                                                backgroundColor: isSelected ? colors.primary + '15' : 'transparent'
                                            }
                                        ]}
                                        onPress={() => handleTypeSelect(t)}
                                        activeOpacity={0.7}
                                    >
                                        <Icon
                                            size={20}
                                            color={isSelected ? colors.primary : colors.textSecondary}
                                            strokeWidth={isSelected ? 2.5 : 2}
                                        />
                                        <Text style={[
                                            styles.typeText,
                                            { color: isSelected ? colors.primary : colors.textSecondary }
                                        ]}>
                                            {typeConfig[t].label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Behavior Type Selector (only for habit/daily) */}
                        {showBehaviorSelector && (
                            <View style={styles.behaviorSection}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TYPE</Text>
                                <View style={styles.behaviorSelector}>
                                    <TouchableOpacity
                                        style={[
                                            styles.behaviorBtn,
                                            {
                                                borderColor: behaviorType === 'positive' ? colors.primary : colors.border,
                                                backgroundColor: behaviorType === 'positive' ? colors.primary + '15' : 'transparent'
                                            }
                                        ]}
                                        onPress={() => handleBehaviorSelect('positive')}
                                        activeOpacity={0.7}
                                    >
                                        <Plus
                                            size={18}
                                            color={behaviorType === 'positive' ? colors.primary : colors.textSecondary}
                                        />
                                        <View style={styles.behaviorContent}>
                                            <Text style={[
                                                styles.behaviorTitle,
                                                { color: behaviorType === 'positive' ? colors.primary : colors.textPrimary }
                                            ]}>
                                                Positive
                                            </Text>
                                            <Text style={[styles.behaviorDesc, { color: colors.textSecondary }]}>
                                                Do this regularly
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.behaviorBtn,
                                            {
                                                borderColor: behaviorType === 'negative' ? colors.primary : colors.border,
                                                backgroundColor: behaviorType === 'negative' ? colors.primary + '15' : 'transparent'
                                            }
                                        ]}
                                        onPress={() => handleBehaviorSelect('negative')}
                                        activeOpacity={0.7}
                                    >
                                        <Minus
                                            size={18}
                                            color={behaviorType === 'negative' ? colors.primary : colors.textSecondary}
                                        />
                                        <View style={styles.behaviorContent}>
                                            <Text style={[
                                                styles.behaviorTitle,
                                                { color: behaviorType === 'negative' ? colors.primary : colors.textPrimary }
                                            ]}>
                                                Negative
                                            </Text>
                                            <Text style={[styles.behaviorDesc, { color: colors.textSecondary }]}>
                                                Avoid this behavior
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Title Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                {behaviorType === 'negative' && showBehaviorSelector ? 'AVOID' : 'TITLE'}
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        color: colors.textPrimary,
                                        borderColor: colors.border,
                                        backgroundColor: colors.background
                                    }
                                ]}
                                placeholder={behaviorType === 'negative' ? "What to avoid? e.g., No junk food" : "What do you want to achieve?"}
                                placeholderTextColor={colors.textSecondary + '80'}
                                value={title}
                                onChangeText={setTitle}
                                returnKeyType="next"
                                blurOnSubmit={false}
                            />
                        </View>

                        {/* Notes Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NOTES (OPTIONAL)</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.textArea,
                                    {
                                        color: colors.textPrimary,
                                        borderColor: colors.border,
                                        backgroundColor: colors.background
                                    }
                                ]}
                                placeholder="Add details..."
                                placeholderTextColor={colors.textSecondary + '80'}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                onFocus={() => {
                                    // Mark notes field as focused so keyboard show handler can scroll
                                    notesFocusedRef.current = true;
                                }}
                                onBlur={() => {
                                    notesFocusedRef.current = false;
                                }}
                            />
                        </View>

                        {/* Due Date Picker (only for todos) */}
                        {type === 'todo' && (
                            <View style={styles.inputWrapper}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DUE DATE</Text>
                                <View style={styles.dueDateRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.dueDateBtn,
                                            dueDate.getTime() === startOfToday().getTime() && {
                                                borderColor: colors.primary,
                                                backgroundColor: colors.primary + '15'
                                            },
                                            { borderColor: colors.border }
                                        ]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setDueDate(startOfToday());
                                        }}
                                    >
                                        <Text style={[
                                            styles.dueDateBtnText,
                                            { color: dueDate.getTime() === startOfToday().getTime() ? colors.primary : colors.textSecondary }
                                        ]}>Today</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.dueDateBtn,
                                            dueDate.getTime() === addDays(startOfToday(), 1).getTime() && {
                                                borderColor: colors.primary,
                                                backgroundColor: colors.primary + '15'
                                            },
                                            { borderColor: colors.border }
                                        ]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setDueDate(addDays(startOfToday(), 1));
                                        }}
                                    >
                                        <Text style={[
                                            styles.dueDateBtnText,
                                            { color: dueDate.getTime() === addDays(startOfToday(), 1).getTime() ? colors.primary : colors.textSecondary }
                                        ]}>Tomorrow</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.dueDateBtn,
                                            dueDate.getTime() === addDays(startOfToday(), 7).getTime() && {
                                                borderColor: colors.primary,
                                                backgroundColor: colors.primary + '15'
                                            },
                                            { borderColor: colors.border }
                                        ]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setDueDate(addDays(startOfToday(), 7));
                                        }}
                                    >
                                        <Text style={[
                                            styles.dueDateBtnText,
                                            { color: dueDate.getTime() === addDays(startOfToday(), 7).getTime() ? colors.primary : colors.textSecondary }
                                        ]}>Next Week</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    style={[styles.selectedDateRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setShowDatePicker(true);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Calendar color={colors.primary} size={18} />
                                    <Text style={[styles.selectedDateText, { color: colors.textPrimary, flex: 1 }]}>
                                        {format(dueDate, 'EEEE, MMMM d, yyyy')}
                                    </Text>
                                    <ChevronRight color={colors.textSecondary} size={18} />
                                </TouchableOpacity>

                                {showDatePicker && (
                                    Platform.OS === 'ios' ? (
                                        <View style={[styles.datePickerContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                                            <View style={styles.datePickerHeader}>
                                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                                    <Text style={[styles.datePickerDone, { color: colors.primary }]}>Done</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <DateTimePicker
                                                value={dueDate}
                                                mode="date"
                                                display="spinner"
                                                minimumDate={startOfToday()}
                                                onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                                                    if (selectedDate) {
                                                        setDueDate(selectedDate);
                                                    }
                                                }}
                                                textColor={colors.textPrimary}
                                            />
                                        </View>
                                    ) : (
                                        <DateTimePicker
                                            value={dueDate}
                                            mode="date"
                                            display="default"
                                            minimumDate={startOfToday()}
                                            onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                                                setShowDatePicker(false);
                                                if (event.type === 'set' && selectedDate) {
                                                    setDueDate(selectedDate);
                                                }
                                            }}
                                        />
                                    )
                                )}
                            </View>
                        )}

                        {/* Create Button */}
                        <AnimatedTouchable
                            style={[
                                styles.addBtn,
                                { backgroundColor: title.trim() ? colors.primary : colors.border },
                                buttonAnimatedStyle
                            ]}
                            onPress={handleAdd}
                            disabled={!title.trim()}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.addBtnText,
                                { opacity: title.trim() ? 1 : 0.5 }
                            ]}>
                                {behaviorType === 'negative' && showBehaviorSelector ? 'Create Avoidance Goal' : 'Create Quest'}
                            </Text>
                        </AnimatedTouchable>
                    </ScrollView>
                </Animated.View>
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
    backdrop: {
        flex: 1,
    },
    container: {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        borderWidth: 1,
        borderBottomWidth: 0,
        padding: 20,
        maxHeight: '85%',
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
    closeBtn: {
        padding: 4,
    },
    scrollContent: {
        paddingBottom: 10,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        gap: 8,
    },
    typeText: {
        ...TEXT_STYLES.captionBold,
        fontFamily: 'Inter_600SemiBold',
    },
    behaviorSection: {
        marginBottom: 20,
    },
    behaviorSelector: {
        flexDirection: 'row',
        gap: 10,
    },
    behaviorBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        gap: 10,
    },
    behaviorContent: {
        flex: 1,
    },
    behaviorTitle: {
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
    },
    behaviorDesc: {
        fontSize: 11,
        fontFamily: 'Inter_400Regular',
        marginTop: 2,
    },
    inputWrapper: {
        marginBottom: 16,
    },
    inputLabel: {
        ...TEXT_STYLES.label,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1.5,
        borderRadius: RADIUS.md,
        padding: 14,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
    },
    textArea: {
        height: 80,
        paddingTop: 14,
    },
    dueDateRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    dueDateBtn: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dueDateBtnText: {
        fontSize: 13,
        fontFamily: 'Inter_600SemiBold',
    },
    selectedDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
    },
    selectedDateText: {
        fontSize: 15,
        fontFamily: 'Inter_500Medium',
    },
    datePickerContainer: {
        marginTop: 12,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    datePickerDone: {
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
    addBtn: {
        paddingVertical: 16,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        marginTop: 8,
        minHeight: TOUCH.minTarget,
    },
    addBtnText: {
        color: '#fff',
        ...TEXT_STYLES.button,
        fontFamily: 'Inter_600SemiBold',
    },
});