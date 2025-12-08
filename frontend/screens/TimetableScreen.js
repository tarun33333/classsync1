import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator } from 'react-native';
import client from '../api/client';

const TimetableScreen = ({ route }) => {
    const { role } = route.params; // 'student' or 'teacher'
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const endpoint = role === 'teacher' ? '/routines/teacher/full' : '/routines/student/full';
            const res = await client.get(endpoint);

            // Organize by Day for SectionList
            const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

            const grouped = daysOrder.map(day => ({
                title: day,
                data: res.data.filter(item => item.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
            })).filter(section => section.data.length > 0);

            setTimetable(grouped);
        } catch (error) {
            console.log('Error fetching timetable');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.timeContainer}>
                <Text style={styles.startTime}>{item.startTime}</Text>
                <Text style={styles.endTime}>{item.endTime}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.subject}>{item.subject}</Text>
                {role === 'student' && (
                    <Text style={styles.teacher}>Teacher: {item.teacher?.name || 'Faculty'}</Text>
                )}
                {role === 'teacher' && (
                    <Text style={styles.details}>{item.dept} - {item.batch}</Text>
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4834d4" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SectionList
                sections={timetable}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={styles.header}>
                        <Text style={styles.headerText}>{title}</Text>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.noData}>No schedule found.</Text>}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#eef2f5',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd'
    },
    headerText: { fontSize: 18, fontWeight: 'bold', color: '#4834d4' },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        marginHorizontal: 15,
        marginVertical: 6,
        borderRadius: 8,
        elevation: 1,
        alignItems: 'center'
    },
    timeContainer: {
        marginRight: 15,
        borderRightWidth: 1,
        borderRightColor: '#eee',
        paddingRight: 15,
        alignItems: 'center',
        width: 60
    },
    startTime: { fontWeight: 'bold', color: '#333' },
    endTime: { fontSize: 12, color: '#888' },
    infoContainer: { flex: 1 },
    subject: { fontSize: 16, fontWeight: '600', color: '#333' },
    teacher: { fontSize: 14, color: '#666', marginTop: 2 },
    details: { fontSize: 12, color: '#888', marginTop: 2 },
    noData: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 }
});

export default TimetableScreen;
