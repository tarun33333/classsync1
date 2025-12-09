import React, { useContext, useState, useEffect } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading } = useContext(AuthContext);
    const [deviceId, setDeviceId] = useState(null);

    useEffect(() => {
        const getDeviceId = async () => {
            let id = 'unknown';
            if (Platform.OS === 'android') {
                id = Application.androidId;
            } else if (Platform.OS === 'ios') {
                id = await Application.getIosIdForVendorAsync();
            }
            setDeviceId(id);
        };
        getDeviceId();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        try {
            await login(email, password, deviceId);
        } catch (error) {
            Alert.alert('Login Failed', error.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.heroContainer}>
                <Image
                    source={require('../assets/login_hero.png')}
                    style={styles.heroImage}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.formContainer}>
                <View style={styles.headerContainer}>
                    <Text style={styles.welcomeText}>Welcome Back</Text>
                    <Text style={styles.subText}>Sign in to continue to ClassSync</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="student@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#A0A0A0"
                    />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.8}>
                    <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>

                <LoadingScreen visible={isLoading} message="Logging In..." />

                <Text style={styles.footer}>Device ID: {deviceId}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    heroContainer: {
        flex: 0.4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F9FF',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
        overflow: 'hidden',
    },
    heroImage: {
        width: '90%',
        height: '90%',
    },
    formContainer: {
        flex: 0.6,
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    headerContainer: {
        marginBottom: 30,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: '#666666',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#333333',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E1E1E1',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        color: '#333333',
    },
    button: {
        backgroundColor: '#4A90E2',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loader: {
        marginTop: 20,
    },
    footer: {
        marginTop: 30,
        textAlign: 'center',
        color: '#AAAAAA',
        fontSize: 12,
    }
});

export default LoginScreen;
