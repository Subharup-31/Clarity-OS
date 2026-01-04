import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { X, Save } from 'lucide-react-native';

interface NameEditModalProps {
    visible: boolean;
    currentName: string;
    onClose: () => void;
    onSave: (name: string) => void;
}

export const NameEditModal: React.FC<NameEditModalProps> = ({ visible, currentName, onClose, onSave }) => {
    const { colors, spacing } = useTheme();
    const [name, setName] = useState(currentName);

    useEffect(() => {
        setName(currentName);
    }, [currentName]);

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>Change Name</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X color={colors.textSecondary} size={24} />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.background,
                            color: colors.textPrimary,
                            borderColor: colors.border
                        }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter name"
                        placeholderTextColor={colors.textSecondary}
                        autoFocus
                    />

                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                        onPress={handleSave}
                    >
                        <Text style={styles.btnText}>Save Name</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    input: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 18,
        marginBottom: 24,
    },
    saveBtn: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
