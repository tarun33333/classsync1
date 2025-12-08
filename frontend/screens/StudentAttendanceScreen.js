import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import client from '../api/client';
import * as Network from 'expo-network';

const StudentAttendanceScreen = ({ route, navigation }) => {
    const { sessionId, mode } = route.params;
    const [step, setStep] = useState(1); // 1: WiFi, 2: OTP/QR
    const [otp, setOtp] = useState('');
    const [scanning, setScanning] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [wifiVerified, setWifiVerified] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();

        // Auto-verify WiFi if mode is provided
        if (mode) {
            handleAutoFlow();
        }
    }, [mode]);

    const handleAutoFlow = async () => {
        if (mode === 'qr') {
            // QR Mode: Skip WiFi check (assumes physical presence to scan)
            setStep(2);
            setScanning(true);
        }
        // OTP Mode: Do NOT auto-verify. Show Step 1 so user sees IP and clicks Verify manually.
    };

    const verifyWifi = async (silent = false) => {
        try {
            // In production, use a native module or config plugin to get BSSID.
            // For now, we'll send the IP or a placeholder, but NOT the debug bypass.
            const bssid = (await Network.getIpAddressAsync()) || 'UNKNOWN';

            await client.post('/attendance/verify-wifi', { sessionId, bssid });
            setStep(2);
            setWifiVerified(true);
            return true;
        } catch (error) {
            if (!silent) Alert.alert('WiFi Verification Failed', error.response?.data?.message || 'Error');
            return false;
        }
    };

    const submitOtp = async () => {
        try {
            await client.post('/attendance/mark', { sessionId, code: otp, method: 'otp' });
            Alert.alert('Success', 'Attendance Marked via OTP!', [
                { text: 'OK', onPress: () => navigation.navigate('StudentMain') }
            ]);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
        }
    };

    const handleBarCodeScanned = async ({ type, data }) => {
        setScanned(true);
        setScanning(false);
        try {
            await client.post('/attendance/mark', { sessionId, code: data, method: 'qr' });
            Alert.alert('Success', 'Attendance Marked via QR!', [
                { text: 'OK', onPress: () => navigation.navigate('StudentMain') }
            ]);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Invalid QR');
            setScanned(false);
        }
    };

    if (scanning) {
        if (hasPermission === null) {
            return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
        }
        if (hasPermission === false) {
            return <View style={styles.center}><Text>No access to camera</Text><Button title="Back" onPress={() => setScanning(false)} /></View>;
        }

        return (
            <View style={styles.container}>
                <CameraView
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "pdf417"],
                    }}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setScanning(false)}>
                        <Text style={styles.btnText}>Cancel Scan</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mark Attendance</Text>

            {step === 1 && (
                <View style={styles.card}>
                    <Text style={styles.instruction}>Step 1: Check Connection</Text>
                    <Text style={styles.subtext}>Please ensure you are connected to the classroom WiFi.</Text>
                    <TouchableOpacity style={styles.verifyBtn} onPress={() => verifyWifi(false)}>
                        <Text style={styles.btnText}>Verify WiFi Position</Text>
                    </TouchableOpacity>
                </View>
            )}

            {step === 2 && (
                <View style={styles.card}>
                    <Text style={styles.instruction}>Step 2: Authenticate</Text>

                    <Text style={styles.label}>Enter Session OTP</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="4-digit OTP"
                        placeholderTextColor="#999"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={4}
                    />
                    <TouchableOpacity style={styles.submitBtn} onPress={submitOtp}>
                        <Text style={styles.btnText}>Submit OTP</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.line} />
                        <Text style={styles.orText}>OR</Text>
                        <View style={styles.line} />
                    </View>

                    <TouchableOpacity style={styles.scanBtn} onPress={() => { setScanned(false); setScanning(true); }}>
                        <Text style={styles.btnText}>Scan QR Code</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f0f2f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
    card: { backgroundColor: '#fff', padding: 25, borderRadius: 15, elevation: 4 },
    instruction: { fontSize: 20, marginBottom: 10, fontWeight: 'bold', color: '#444' },
    subtext: { color: '#666', marginBottom: 20 },

    label: { fontSize: 16, marginTop: 10, marginBottom: 8, fontWeight: '600', color: '#333' },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fafafa',
        padding: 15,
        marginBottom: 15,
        borderRadius: 10,
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 4
    },

    verifyBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10, alignItems: 'center' },
    submitBtn: { backgroundColor: '#4834d4', padding: 15, borderRadius: 10, alignItems: 'center' },
    scanBtn: { backgroundColor: '#2d3436', padding: 15, borderRadius: 10, alignItems: 'center' },

    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    line: { flex: 1, height: 1, backgroundColor: '#eee' },
    orText: { marginHorizontal: 10, color: '#999', fontWeight: 'bold' },

    overlay: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
    cancelBtn: { backgroundColor: 'rgba(255, 59, 48, 0.8)', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 }
});

export default StudentAttendanceScreen;
