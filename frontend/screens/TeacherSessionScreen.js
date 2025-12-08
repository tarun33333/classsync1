import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import client from '../api/client';

const TeacherSessionScreen = ({ route, navigation }) => {
    const { session } = route.params;
    const [attendanceList, setAttendanceList] = useState([]);
    const [refreshInterval, setRefreshInterval] = useState(null);

    useEffect(() => {
        fetchAttendance();
        const interval = setInterval(fetchAttendance, 5000); // Poll every 5s
        setRefreshInterval(interval);
        return () => clearInterval(interval);
    }, []);

    const fetchAttendance = async () => {
        try {
            const res = await client.get(`/attendance/session/${session._id}`);
            setAttendanceList(res.data);
        } catch (error) {
            console.log('Error fetching attendance');
        }
    };

    const endSession = async () => {
        try {
            await client.post('/sessions/end', { sessionId: session._id });
            clearInterval(refreshInterval);
            navigation.navigate('TeacherMain');
        } catch (error) {
            Alert.alert('Error', 'Failed to end session');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Session Active: {session.subject}</Text>

            <View style={styles.infoBox}>
                <Text style={styles.infoText}>OTP: {session.otp}</Text>
                <View style={styles.qrContainer}>
                    <QRCode value={session.qrCode} size={150} />
                </View>
                <Text style={styles.infoText}>Scan to Mark Attendance</Text>
            </View>

            <Text style={styles.subHeader}>Live Attendance ({attendanceList.length})</Text>
            <FlatList
                data={attendanceList}
                keyExtractor={(item) => item.student._id}
                renderItem={({ item }) => (
                    <View style={styles.listItem}>
                        <Text>{item.student.name} ({item.student.rollNumber})</Text>
                        <Text style={[styles.method, { color: item.status === 'present' ? 'green' : 'red' }]}>
                            {item.status === 'present' ? item.method.toUpperCase() : 'ABSENT'}
                        </Text>
                    </View>
                )}
            />

            <Button title="End Session" onPress={endSession} color="red" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    infoBox: { alignItems: 'center', marginBottom: 20, padding: 10, borderWidth: 1, borderColor: '#ddd' },
    infoText: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
    qrContainer: { marginVertical: 10 },
    subHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    method: { fontWeight: 'bold', color: 'green' }
});

export default TeacherSessionScreen;
