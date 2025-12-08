import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import client from '../api/client';

const StudentHistoryScreen = () => {
    const [history, setHistory] = useState([]);
    const [markedDates, setMarkedDates] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyHistory, setDailyHistory] = useState([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        if (history.length > 0) {
            filterHistoryByDate(selectedDate);
        }
    }, [selectedDate, history]);

    const fetchHistory = async () => {
        try {
            const res = await client.get('/attendance/student');
            setHistory(res.data);

            const marks = {};
            res.data.forEach(item => {
                const dateStr = item.timestamp || item.session?.startTime || item.createdAt;
                const date = new Date(dateStr).toISOString().split('T')[0];
                marks[date] = {
                    marked: true,
                    dotColor: item.status === 'present' ? 'green' : 'red'
                };
            });
            setMarkedDates(marks);
        } catch (error) {
            console.log(error);
        }
    };

    const filterHistoryByDate = (date) => {
        const filtered = history.filter(item => {
            const itemDateStr = item.timestamp || item.session?.startTime || item.createdAt;
            return new Date(itemDateStr).toISOString().split('T')[0] === date;
        });
        setDailyHistory(filtered);
    };

    const onDayPress = (day) => {
        setSelectedDate(day.dateString);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View>
                <Text style={styles.subject}>{item.session?.subject || 'Archived Class'}</Text>
                <Text style={styles.time}>{new Date(item.session?.startTime || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.status, item.status === 'present' ? styles.present : styles.absent]}>
                    {item.status.toUpperCase()}
                </Text>
                <Text style={styles.method}>{item.method ? `via ${item.method.toUpperCase()}` : 'Manual'}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>History Calendar</Text>

            <Calendar
                onDayPress={onDayPress}
                markedDates={{
                    ...markedDates,
                    [selectedDate]: { selected: true, selectedColor: 'blue' }
                }}
                theme={{
                    todayTextColor: 'blue',
                    arrowColor: 'blue',
                }}
            />

            <Text style={styles.subtitle}>Records for {selectedDate}</Text>

            <FlatList
                data={dailyHistory}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.noData}>No classes recorded for this date.</Text>}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, marginLeft: 5 },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f9f9f9',
        marginBottom: 10,
        borderRadius: 8,
        borderLeftWidth: 5,
        borderLeftColor: '#ccc' // Default border
    },
    subject: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    time: { color: '#666', marginTop: 4 },
    status: { fontWeight: 'bold', fontSize: 14 },
    present: { color: 'green' },
    absent: { color: 'red' },
    method: { fontSize: 12, color: '#888', marginTop: 2 },
    noData: { textAlign: 'center', marginTop: 20, color: '#aaa', fontStyle: 'italic' }
});

export default StudentHistoryScreen;
