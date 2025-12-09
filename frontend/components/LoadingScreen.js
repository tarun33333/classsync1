import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal, ActivityIndicator } from 'react-native';

const LoadingScreen = ({ visible = false, message = 'Loading...' }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent animationType="none" visible={visible}>
            <View style={styles.container}>
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                    {message && <Text style={styles.text}>{message}</Text>}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    text: {
        marginTop: 12,
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
    }
});

export default LoadingScreen;
