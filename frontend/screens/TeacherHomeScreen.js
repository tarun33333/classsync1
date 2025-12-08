import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, FlatList, TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import * as Network from 'expo-network';

const TeacherHomeScreen = ({ navigation }) => {
    const { userInfo } = useContext(AuthContext);
    const [routines, setRoutines] = useState([]);
    const [activeSession, setActiveSession] = useState(null);

    useEffect(() => {
        fetchRoutines();
        checkActiveSession();
    }, []);

    const fetchRoutines = async () => {
        try {
            const res = await client.get('/routines/teacher');
            setRoutines(res.data);
        } catch (error) {
            console.log('Error fetching routines');
        }
    };

    const checkActiveSession = async () => {
        try {
            const res = await client.get('/sessions/active');
            if (res.data) {
                setActiveSession(res.data);
                navigation.navigate('TeacherSession', { session: res.data });
            }
        } catch (error) {
            console.log('No active session');
        }
    };

    const startSession = async (routine) => {
        try {
            const { isConnected } = await Network.getNetworkStateAsync();
            if (!isConnected) {
                Alert.alert('Error', 'No internet connection');
                return;
            }

            const sessionData = {
                subject: routine.subject,
                section: routine.section,
                bssid: (await Network.getIpAddressAsync()) || 'UNKNOWN',
                ssid: 'ClassWiFi' // Optional, just a label
            };

            const res = await client.post('/sessions/start', sessionData);
            navigation.navigate('TeacherSession', { session: res.data });
        } catch (error) {
            Alert.alert('Error', 'Failed to start session');
        }
    };

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 10000); // 10s check
        return () => clearInterval(timer);
    }, []);

    const isCurrentPeriod = (start, end) => {
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const currentTimeVal = currentHour * 60 + currentMin;

        const [startHour, startMin] = start.split(':').map(Number);
        const startTimeVal = startHour * 60 + startMin;

        const [endHour, endMin] = end.split(':').map(Number);
        const endTimeVal = endHour * 60 + endMin;

        return currentTimeVal >= startTimeVal && currentTimeVal < endTimeVal;
    };

    const renderRoutine = ({ item }) => {
        const canStart = isCurrentPeriod(item.startTime, item.endTime);

        return (
            <View style={styles.card}>
                <View>
                    <Text style={styles.subject}>{item.subject}</Text>
                    <Text style={styles.details}>{item.section} | {item.day} | {item.startTime} - {item.endTime}</Text>
                </View>
                {canStart && (
                    <Button title="Start" onPress={() => startSession(item)} />
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome, {userInfo.name}</Text>
            <Text style={styles.subtitle}>Your Schedule</Text>

            <FlatList
                data={routines.filter(r => r.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }))}
                keyExtractor={(item, index) => item._id || `${item.subject}-${item.startTime}-${index}`}
                renderItem={renderRoutine}
                ListEmptyComponent={<Text style={styles.noData}>No classes assigned for today.</Text>}
            />

            <TouchableOpacity
                style={styles.fullScheduleBtn}
                onPress={() => navigation.navigate('Timetable', { role: 'teacher' })}
            >
                <Text style={styles.fullScheduleText}>View Full Weekly Schedule</Text>
            </TouchableOpacity>


        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    subtitle: { fontSize: 18, marginBottom: 20, color: '#666' },
    card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', marginBottom: 10, borderRadius: 8, elevation: 2 },
    subject: { fontSize: 18, fontWeight: 'bold' },
    details: { color: '#555' },
    noData: { textAlign: 'center', marginTop: 20, color: '#888' },
    logout: { marginTop: 20 },
    fullScheduleBtn: {
        backgroundColor: '#eef2f5',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20
    },
    fullScheduleText: {
        color: '#4834d4',
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default TeacherHomeScreen;
