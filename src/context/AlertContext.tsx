
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

// Types
type AlertButton = {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
};

type AlertOptions = {
    title: string;
    message: string;
    buttons?: AlertButton[];
};

interface AlertContextType {
    showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

// -- UI COMPONENT --
const CustomAlert = ({
    visible,
    title,
    message,
    buttons,
    onClose
}: AlertOptions & { visible: boolean; onClose: () => void }) => {
    const { colors, spacing, sizes } = useTheme();

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[
                    styles.alertContainer,
                    {
                        // Use "Less Transparent" background (Opacity + 0.2)
                        backgroundColor: (colors as any).alertCardBg || colors.cardBg,
                        borderColor: colors.primary
                    }
                ]}>
                    <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.textPrimary }]}>{message}</Text>

                    <View style={styles.buttonRow}>
                        {buttons?.map((btn, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    {
                                        backgroundColor: btn.style === 'cancel' ? 'transparent' : colors.primary,
                                        borderColor: btn.style === 'cancel' ? colors.border : 'transparent',
                                        borderWidth: btn.style === 'cancel' ? 1 : 0
                                    }
                                ]}
                                onPress={() => {
                                    onClose();
                                    if (btn.onPress) btn.onPress();
                                }}
                            >
                                <Text style={[
                                    styles.buttonText,
                                    { color: btn.style === 'cancel' ? colors.textSecondary : (colors.background === '#000000' || colors.background === '#121212' ? '#000' : '#fff') }
                                ]}>
                                    {btn.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// -- PROVIDER --
export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [alertState, setAlertState] = useState<AlertOptions & { visible: boolean }>({
        visible: false,
        title: '',
        message: '',
        buttons: []
    });

    const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
        setAlertState({
            visible: true,
            title,
            message,
            buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }]
        });
    };

    const hideAlert = () => {
        setAlertState(prev => ({ ...prev, visible: false }));
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                visible={alertState.visible}
                title={alertState.title}
                message={alertState.message}
                buttons={alertState.buttons}
                onClose={hideAlert}
            />
        </AlertContext.Provider>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        fontFamily: 'Inter_700Bold',
    },
    message: {
        fontSize: 16,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap-reverse', // Wrap if many buttons, destructive (cancel) usually left/bottom
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 16,
    }
});
