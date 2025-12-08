import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Button, TouchableOpacity, Alert, Modal, ActivityIndicator, Platform } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import client from '../api/client';
import * as FileSystem from 'expo-file-system/legacy';
const { StorageAccessFramework } = FileSystem;
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

const screenWidth = Dimensions.get('window').width;

const TeacherReportsScreen = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [studentList, setStudentList] = useState([]);

    useEffect(() => {
        fetchSessionsForDate(selectedDate);
    }, [selectedDate]);

    useEffect(() => {
        if (selectedSession) {
            fetchSessionDetails(selectedSession);
            // Update stats for the selected session
            const session = sessions.find(s => s.sessionId === selectedSession);
            if (session) {
                setStats({
                    present: session.presentCount || 0,
                    absent: session.absentCount || 0,
                    label: `${session.subject} (${session.section})`
                });
            }
        } else {
            setStats(null);
            setStudentList([]);
        }
    }, [selectedSession]);

    const fetchSessionsForDate = async (date) => {
        setLoading(true);
        try {
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
            const res = await client.get(`/attendance/reports/filter?date=${dateStr}`);
            setSessions(res.data);
            if (res.data.length > 0) {
                setSelectedSession(res.data[0].sessionId);
            } else {
                setSelectedSession(null);
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionDetails = async (sessionId) => {
        try {
            const res = await client.get(`/attendance/session/${sessionId}`);
            setStudentList(res.data);
        } catch (error) {
            console.log('Error fetching detailed list');
        }
    };

    const onDateChange = (event, selected) => {
        const currentDate = selected || selectedDate;
        setShowDatePicker(Platform.OS === 'ios');
        setSelectedDate(currentDate);
    };

    const downloadExcel = async () => {
        if (!selectedSession || studentList.length === 0) return;

        try {
            setLoading(true);

            // Construct CSV
            let csv = 'Name,Roll Number,Status,Method,Time\n';
            studentList.forEach(record => {
                const name = record.student ? record.student.name : 'Unknown';
                const roll = record.student ? record.student.rollNumber : 'N/A';
                const status = record.status;
                const method = record.method || 'N/A';
                const time = new Date(record.createdAt).toLocaleTimeString();
                csv += `${name},${roll},${status},${method},${time}\n`;
            });

            const fileName = `Attendance_${stats?.label}_${selectedDate.toISOString().split('T')[0]}.csv`;

            if (Platform.OS === 'android') {
                // Android: Save to Custom Folder via SAF
                try {
                    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

                    if (permissions.granted) {
                        const targetUri = permissions.directoryUri;
                        try {
                            const createdUri = await StorageAccessFramework.createFileAsync(targetUri, fileName, 'text/csv');
                            await FileSystem.writeAsStringAsync(createdUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
                            Alert.alert('Success', 'Report saved to selected folder!');
                        } catch (e) {
                            console.log(e);
                            Alert.alert('Error', 'Could not save file. Folder might be restricted.');
                        }
                    } else {
                        Alert.alert('Permission Denied', 'Cannot save without directory permission.');
                    }
                } catch (err) {
                    console.log(err);
                    Alert.alert('Error', 'Failed to access storage mechanism.');
                }
            } else {
                // iOS / Fallback
                const fileUri = FileSystem.documentDirectory + fileName;
                await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                } else {
                    Alert.alert('Success', 'File saved to Documents');
                }
            }

        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to download report');
        } finally {
            setLoading(false);
        }
    };

    const chartConfig = {
        backgroundGradientFrom: "#1E2923",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#08130D",
        backgroundGradientToOpacity: 0.5,
        color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false
    };

    const pieData = stats ? [
        {
            name: "Present",
            population: stats.present,
            color: "#4caf50",
            legendFontColor: "#7F7F7F",
            legendFontSize: 15
        },
        {
            name: "Absent",
            population: stats.absent,
            color: "#f44336",
            legendFontColor: "#7F7F7F",
            legendFontSize: 15
        }
    ] : [];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Select Date:</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
                    <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}
            </View>

            {loading && <ActivityIndicator size="large" color="#0000ff" />}

            {!loading && sessions.length === 0 && (
                <Text style={styles.noData}>No sessions found for this date.</Text>
            )}

            {sessions.length > 0 && (
                <View style={styles.sessionSelector}>
                    <Text style={styles.label}>Select Class:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {sessions.map(session => (
                            <TouchableOpacity
                                key={session.sessionId}
                                style={[styles.sessionChip, selectedSession === session.sessionId && styles.selectedChip]}
                                onPress={() => setSelectedSession(session.sessionId)}
                            >
                                <Text style={[styles.chipText, selectedSession === session.sessionId && styles.selectedChipText]}>
                                    {session.subject} ({session.section})
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {stats && (
                <View style={styles.statsContainer}>
                    <Text style={styles.chartTitle}>Attendance Overview</Text>

                    {stats.present + stats.absent > 0 ? (
                        <PieChart
                            data={pieData}
                            width={screenWidth - 40}
                            height={220}
                            chartConfig={chartConfig}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[10, 0]}
                            absolute
                        />
                    ) : (
                        <Text style={styles.noData}>No attendance marked.</Text>
                    )}

                    <View style={styles.countRow}>
                        <View style={styles.countBox}>
                            <Text style={styles.countLabel}>Present</Text>
                            <Text style={[styles.countValue, { color: 'green' }]}>{stats.present}</Text>
                        </View>
                        <View style={styles.countBox}>
                            <Text style={styles.countLabel}>Absent</Text>
                            <Text style={[styles.countValue, { color: 'red' }]}>{stats.absent}</Text>
                        </View>
                        <View style={styles.countBox}>
                            <Text style={styles.countLabel}>Total</Text>
                            <Text style={styles.countValue}>{stats.present + stats.absent}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.downloadBtn} onPress={downloadExcel}>
                        <Text style={styles.downloadText}>Download Excel Report</Text>
                    </TouchableOpacity>

                    {/* Student List Table */}
                    <Text style={styles.tableTitle}>Student List</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.cell, { flex: 2 }]}>Name</Text>
                            <Text style={[styles.cell, { flex: 1 }]}>Roll</Text>
                            <Text style={[styles.cell, { flex: 1 }]}>Status</Text>
                        </View>
                        {studentList.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.cell, { flex: 2 }]}>{item.student?.name || 'Unknown'}</Text>
                                <Text style={[styles.cell, { flex: 1 }]}>{item.student?.rollNumber || '-'}</Text>
                                <Text style={[styles.cell, { flex: 1, color: item.status === 'present' ? 'green' : 'red', fontWeight: 'bold' }]}>
                                    {item.status.toUpperCase()}
                                </Text>
                            </View>
                        ))}
                    </View>

                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 18, marginRight: 10, fontWeight: 'bold' },
    datePickerBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    dateText: { fontSize: 16, fontWeight: 'bold' },
    noData: { textAlign: 'center', marginVertical: 20, fontSize: 16, color: '#666' },

    sessionSelector: { marginBottom: 20 },
    label: { fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
    sessionChip: { padding: 10, backgroundColor: '#e0e0e0', borderRadius: 20, marginRight: 10 },
    selectedChip: { backgroundColor: '#007bff' },
    chipText: { color: '#333' },
    selectedChipText: { color: '#fff' },

    statsContainer: { backgroundColor: 'white', borderRadius: 15, padding: 20, alignItems: 'center', elevation: 3, marginBottom: 30 },
    chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

    countRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20, marginBottom: 20 },
    countBox: { alignItems: 'center' },
    countLabel: { fontSize: 14, color: '#666' },
    countValue: { fontSize: 20, fontWeight: 'bold' },

    downloadBtn: { backgroundColor: '#28a745', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, width: '100%', alignItems: 'center', marginBottom: 20 },
    downloadText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    tableTitle: { fontSize: 18, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 10, marginTop: 10 },
    table: { width: '100%', borderWidth: 1, borderColor: '#eee' },
    tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    tableHeader: { backgroundColor: '#f9f9f9' },
    cell: { fontSize: 14 }
});

export default TeacherReportsScreen;
