import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform, TouchableOpacity, ScrollView, Switch, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../api/client';
import { Ionicons } from '@expo/vector-icons';

const ODApplyScreen = ({ navigation }) => {
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [reason, setReason] = useState('');
    const [showFrom, setShowFrom] = useState(false);
    const [showTo, setShowTo] = useState(false);

    // New Features
    const [isFullDay, setIsFullDay] = useState(true);
    const [selectedPeriods, setSelectedPeriods] = useState([]);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await client.get('/od/my');
            setHistory(res.data);
        } catch (error) {
            console.log('Error fetching history');
        }
    };

    const onFromChange = (event, selectedDate) => {
        setShowFrom(Platform.OS === 'ios');
        if (selectedDate) {
            setFromDate(selectedDate);
            // If specific period (single day), sync ToDate
            if (!isFullDay) setToDate(selectedDate);
        }
    };

    const onToChange = (event, selectedDate) => {
        setShowTo(Platform.OS === 'ios');
        if (selectedDate) setToDate(selectedDate);
    };

    const togglePeriod = (p) => {
        if (selectedPeriods.includes(p)) {
            setSelectedPeriods(selectedPeriods.filter(id => id !== p));
        } else {
            setSelectedPeriods([...selectedPeriods, p]);
        }
    };

    const submitOD = async () => {
        if (!reason.trim()) {
            Alert.alert('Error', 'Please provide a reason');
            return;
        }
        if (!isFullDay && selectedPeriods.length === 0) {
            Alert.alert('Error', 'Please select at least one period');
            return;
        }

        try {
            await client.post('/od/apply', {
                fromDate,
                toDate: isFullDay ? toDate : fromDate, // Same day for period OD
                reason,
                odType: isFullDay ? 'FullDay' : 'Period',
                periods: isFullDay ? [] : selectedPeriods
            });
            Alert.alert('Success', 'OD Request Submitted');
            setReason('');
            setSelectedPeriods([]);
            fetchHistory(); // Refresh history
        } catch (error) {
            Alert.alert('Error', 'Failed to apply');
        }
    };

    const renderHistoryItem = ({ item }) => (
        <View style={styles.historyCard}>
            <View>
                <Text style={styles.historyDate}>
                    {new Date(item.fromDate).toLocaleDateString()}
                    {item.odType === 'Period' ? ` (Periods: ${item.periods.join(', ')})` : ` - ${new Date(item.toDate).toLocaleDateString()}`}
                </Text>
                <Text style={styles.historyReason}>{item.reason}</Text>
            </View>
            <View style={[styles.badge,
            item.status === 'Approved' ? styles.bgGreen :
                item.status === 'Rejected' ? styles.bgRed : styles.bgYellow
            ]}>
                <Text style={styles.badgeText}>{item.status}</Text>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>New Application</Text>

            <View style={styles.toggleRow}>
                <Text style={styles.label}>Full Day OD?</Text>
                <Switch
                    value={isFullDay}
                    onValueChange={(val) => {
                        setIsFullDay(val);
                        if (!val) setToDate(fromDate); // Sync dates
                    }}
                />
            </View>

            <Text style={styles.label}>{isFullDay ? "From Date:" : "Date:"}</Text>
            <TouchableOpacity onPress={() => setShowFrom(true)} style={styles.dateBtn}>
                <Text>{fromDate.toDateString()}</Text>
            </TouchableOpacity>
            {showFrom && (
                <DateTimePicker
                    value={fromDate}
                    mode="date"
                    display="default"
                    onChange={onFromChange}
                />
            )}

            {isFullDay && (
                <>
                    <Text style={styles.label}>To Date:</Text>
                    <TouchableOpacity onPress={() => setShowTo(true)} style={styles.dateBtn}>
                        <Text>{toDate.toDateString()}</Text>
                    </TouchableOpacity>
                    {showTo && (
                        <DateTimePicker
                            value={toDate}
                            mode="date"
                            display="default"
                            onChange={onToChange}
                        />
                    )}
                </>
            )}

            {!isFullDay && (
                <View style={styles.periodsContainer}>
                    <Text style={styles.label}>Select Periods:</Text>
                    <View style={styles.periodsGrid}>
                        {[1, 2, 3, 4, 5, 6].map(p => (
                            <TouchableOpacity
                                key={p}
                                style={[styles.periodBtn, selectedPeriods.includes(p) && styles.periodBtnActive]}
                                onPress={() => togglePeriod(p)}
                            >
                                <Text style={[styles.periodText, selectedPeriods.includes(p) && styles.periodTextActive]}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <Text style={styles.label}>Reason:</Text>
            <TextInput
                style={styles.input}
                multiline
                numberOfLines={3}
                value={reason}
                onChangeText={setReason}
                placeholder="Participating in events..."
            />

            <Button title="Submit Application" onPress={submitOD} color="#4834d4" />

            {/* History Section */}
            <Text style={[styles.header, { marginTop: 30 }]}>My History</Text>
            {history.map(item => (
                <View key={item._id} style={styles.historyWrapper}>
                    {renderHistoryItem({ item })}
                </View>
            ))}
            {history.length === 0 && <Text style={styles.noData}>No history found.</Text>}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    header: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    label: { fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 5 },
    dateBtn: { padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginTop: 5,
        marginBottom: 20,
        textAlignVertical: 'top'
    },
    periodsContainer: { marginVertical: 10 },
    periodsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    periodBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', margin: 5 },
    periodBtnActive: { backgroundColor: '#4834d4' },
    periodText: { fontWeight: 'bold', color: '#555' },
    periodTextActive: { color: '#fff' },

    historyWrapper: { marginBottom: 10 },
    historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
    historyDate: { fontWeight: 'bold', color: '#333' },
    historyReason: { fontSize: 12, color: '#666', marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    bgGreen: { backgroundColor: '#d1fae5' },
    bgRed: { backgroundColor: '#ffe0e3' },
    bgYellow: { backgroundColor: '#fff3cd' },
    badgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
    noData: { textAlign: 'center', color: '#999', marginTop: 10 }
});

export default ODApplyScreen;
