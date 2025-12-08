import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView, Dimensions, StatusBar, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo

const { width } = Dimensions.get('window');

const StudentHomeScreen = ({ navigation }) => {
    const { userInfo } = useContext(AuthContext);
    const [periods, setPeriods] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [activePeriod, setActivePeriod] = useState(null);

    const fetchDashboard = async () => {
        try {
            const res = await client.get('/attendance/dashboard');
            setPeriods(res.data);

            // Find active period
            const ongoing = res.data.find(p => p.status === 'ongoing');
            setActivePeriod(ongoing || null);

        } catch (error) {
            console.log('Error fetching dashboard', error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboard(); // Immediate fetch on focus

            // Poll every 2 seconds for live status updates
            const intervalId = setInterval(() => {
                // Silent fetch (no loading spinner for background updates)
                client.get('/attendance/dashboard').then(res => {
                    setPeriods(res.data);
                    const ongoing = res.data.find(p => p.status === 'ongoing');
                    setActivePeriod(ongoing || null);
                }).catch(err => console.log('Background fetch error', err));
            }, 2000);

            return () => clearInterval(intervalId); // Cleanup on blur
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDashboard();
        setRefreshing(false);
    };

    const handleAction = (sessionId, mode) => {
        if (!sessionId) return;
        navigation.navigate('StudentAttendance', { sessionId, mode });
    };

    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

            {/* Header */}
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.userName}>{userInfo.name}</Text>
                </View>
                <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>{currentDay}</Text>
                </View>
            </View>

            {/* Hero Card for Active Session */}
            {activePeriod ? (
                <View style={[styles.heroCard, styles.shadow]}>
                    <View style={styles.heroHeader}>
                        <Text style={styles.liveBadge}>🔴 LIVE PROCTORING</Text>
                        <Text style={styles.heroTime}>{activePeriod.startTime} - {activePeriod.endTime}</Text>
                    </View>

                    <Text style={styles.heroSubject}>{activePeriod.subject}</Text>
                    <Text style={styles.heroTeacher}>Teacher: {activePeriod.teacherName || 'Faculty'}</Text>

                    <Text style={styles.actionLabel}>Mark Your Attendance:</Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.otpBtn]}
                            onPress={() => handleAction(activePeriod.sessionId, 'otp')}
                        >
                            <Ionicons name="keypad-outline" size={24} color="#fff" />
                            <Text style={styles.btnText}>Enter OTP</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.qrBtn]}
                            onPress={() => handleAction(activePeriod.sessionId, 'qr')}
                        >
                            <Ionicons name="qr-code-outline" size={24} color="#fff" />
                            <Text style={styles.btnText}>Scan QR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.heroPlaceholder}>
                    <Ionicons name="cafe-outline" size={40} color="#ccc" />
                    <Text style={styles.placeholderText}>No classes going on right now.</Text>
                </View>
            )}

            {/* Schedule List */}
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <View style={styles.listContainer}>
                {periods
                    .filter(p => p.day === currentDay)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((item, index) => (
                        <View key={index} style={[styles.classCard, item.status === 'ongoing' && styles.activeBorder]}>
                            <View style={styles.timeColumn}>
                                <Text style={styles.startTime}>{item.startTime}</Text>
                                <Text style={styles.endTime}>{item.endTime}</Text>
                            </View>
                            <View style={styles.infoColumn}>
                                <Text style={styles.listSubject}>{item.subject}</Text>
                                <Text style={[
                                    styles.statusText,
                                    item.status === 'present' ? styles.statusPresent :
                                        item.status === 'absent' ? styles.statusAbsent : styles.statusUpcoming
                                ]}>
                                    {item.status ? item.status.toUpperCase() : 'UPCOMING'}
                                </Text>
                            </View>
                            {item.status === 'present' && (
                                <Ionicons name="checkmark-circle" size={24} color="green" />
                            )}
                        </View>
                    ))}
            </View>

            <TouchableOpacity
                style={styles.fullScheduleBtn}
                onPress={() => navigation.navigate('Timetable', { role: 'student' })}
            >
                <Text style={styles.fullScheduleText}>View Full Weekly Schedule</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
    greeting: { fontSize: 16, color: '#666' },
    userName: { fontSize: 24, fontWeight: '800', color: '#333' },
    dateBadge: { backgroundColor: '#eef2f5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    dateText: { color: '#555', fontWeight: '600' },

    shadow: {
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    heroCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#f0f0f0'
    },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    liveBadge: { color: '#ff4757', fontWeight: 'bold', fontSize: 12, backgroundColor: '#ffe0e3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    heroTime: { color: '#666', fontWeight: '600' },
    heroSubject: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
    heroTeacher: { fontSize: 14, color: '#7f8c8d', marginBottom: 20 },
    actionLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 15 },

    buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginHorizontal: 5
    },
    otpBtn: { backgroundColor: '#4834d4' },
    qrBtn: { backgroundColor: '#130f40' },
    btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },

    heroPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        marginBottom: 30,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#e0e0e0'
    },
    placeholderText: { color: '#aaa', marginTop: 10, fontWeight: '500' },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 15 },
    listContainer: { paddingBottom: 20 },
    classCard: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#ddd',
        elevation: 1
    },
    activeBorder: { borderLeftColor: '#4834d4', backgroundColor: '#f0f3ff' },
    timeColumn: { marginRight: 15, borderRightWidth: 1, borderRightColor: '#eee', paddingRight: 15, alignItems: 'center' },
    startTime: { fontWeight: 'bold', color: '#333' },
    endTime: { fontSize: 12, color: '#888' },
    infoColumn: { flex: 1 },
    listSubject: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    statusPresent: { color: 'green' },
    statusAbsent: { color: 'red' },
    statusUpcoming: { color: '#aaa' },
    fullScheduleBtn: {
        backgroundColor: '#eef2f5',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10
    },
    fullScheduleText: {
        color: '#4834d4',
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default StudentHomeScreen;
