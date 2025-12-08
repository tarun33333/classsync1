import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { Ionicons } from '@expo/vector-icons';

const AdvisorDashboard = ({ navigation }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await client.get('/od/advisor');
            setRequests(res.data);
        } catch (error) {
            console.log('Error fetching requests');
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (id, status) => {
        try {
            await client.put(`/od/${id}`, { status });
            Alert.alert('Success', `Request ${status}`);
            fetchRequests(); // Refresh
        } catch (error) {
            Alert.alert('Error', 'Action failed');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.name}>{item.studentName}</Text>
                <Text style={styles.roll}>{item.studentRoll}</Text>
            </View>
            <Text style={styles.date}>
                {new Date(item.fromDate).toDateString()}
                {item.odType === 'Period'
                    ? ` (Periods: ${item.periods.join(', ')})`
                    : ` - ${new Date(item.toDate).toDateString()}`}
            </Text>
            <Text style={styles.reason}>{item.reason}</Text>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.btn, styles.rejectBtn]}
                    onPress={() => handleDecision(item._id, 'Rejected')}
                >
                    <Ionicons name="close" size={20} color="#fff" />
                    <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.btn, styles.approveBtn]}
                    onPress={() => handleDecision(item._id, 'Approved')}
                >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Pending Approvals</Text>
            <FlatList
                data={requests}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.noData}>No pending requests.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    name: { fontSize: 18, fontWeight: 'bold' },
    roll: { color: '#666' },
    date: { color: '#4834d4', fontWeight: 'bold', marginBottom: 5 },
    reason: { color: '#333', marginBottom: 15 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end' },
    btn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginLeft: 10 },
    rejectBtn: { backgroundColor: '#ff4757' },
    approveBtn: { backgroundColor: '#2ed573' },
    btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
    noData: { textAlign: 'center', marginTop: 50, color: '#888' }
});

export default AdvisorDashboard;
