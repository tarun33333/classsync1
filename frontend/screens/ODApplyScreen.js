import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Platform, TouchableOpacity, ScrollView, Switch, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import client from '../api/client';
import { Ionicons } from '@expo/vector-icons';

const ODApplyScreen = ({ navigation }) => {
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [reason, setReason] = useState('');
    const [showFrom, setShowFrom] = useState(false);
    const [showTo, setShowTo] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // New Features
    const [isFullDay, setIsFullDay] = useState(true);
    const [selectedPeriods, setSelectedPeriods] = useState([]);
    const [history, setHistory] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await client.get('/od/my');
            setHistory(res.data);
        } catch (error) {
            console.log('Error fetching history', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const stats = useMemo(() => {
        const total = history.length;
        const approved = history.filter(h => h.status === 'Approved').length;
        const rejected = history.filter(h => h.status === 'Rejected').length;
        const pending = history.filter(h => h.status === 'Pending').length;
        return { total, approved, rejected, pending };
    }, [history]);

    const onFromChange = (event, selectedDate) => {
        setShowFrom(Platform.OS === 'ios');
        if (selectedDate) {
            setFromDate(selectedDate);
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
            Alert.alert('Required', 'Please provide a valid reason.');
            return;
        }
        if (!isFullDay && selectedPeriods.length === 0) {
            Alert.alert('Required', 'Please select at least one period.');
            return;
        }

        setSubmitting(true);
        try {
            await client.post('/od/apply', {
                fromDate,
                toDate: isFullDay ? toDate : fromDate,
                reason,
                odType: isFullDay ? 'FullDay' : 'Period',
                periods: isFullDay ? [] : selectedPeriods
            });
            Alert.alert('Success', 'OD Request Submitted successfully!');
            setReason('');
            setSelectedPeriods([]);
            fetchHistory();
        } catch (error) {
            Alert.alert('Error', 'Failed to submit application. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const StatCard = ({ label, count, color, icon }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View>
                <Text style={styles.statCount}>{count}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </View>
        </View>
    );

    const renderHistoryItem = (item) => (
        <View key={item._id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
                <View style={[styles.statusBadge,
                item.status === 'Approved' ? styles.bgGreen :
                    item.status === 'Rejected' ? styles.bgRed : styles.bgYellow
                ]}>
                    <Text style={[styles.statusText,
                    item.status === 'Approved' ? styles.textGreen :
                        item.status === 'Rejected' ? styles.textRed : styles.textYellow
                    ]}>{item.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>

            <View style={styles.historyContent}>
                <View style={styles.row}>
                    <Ionicons name="calendar-outline" size={16} color="#666" style={{ marginRight: 6 }} />
                    <Text style={styles.historyDateRange}>
                        {new Date(item.fromDate).toLocaleDateString()}
                        {item.odType === 'Period'
                            ? ` (Periods: ${item.periods.join(', ')})`
                            : item.fromDate !== item.toDate ? ` - ${new Date(item.toDate).toLocaleDateString()}` : ''}
                    </Text>
                </View>
                <Text style={styles.historyReason} numberOfLines={2}>{item.reason}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>On-Duty Application</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} />}
            >
                {/* Stats Section */}
                <Text style={styles.sectionHeader}>Overview</Text>
                <View style={styles.statsGrid}>
                    <StatCard label="Applied" count={stats.total} color="#4834d4" icon="paper-plane" />
                    <StatCard label="Approved" count={stats.approved} color="#2ecc71" icon="checkmark-circle" />
                    <StatCard label="Pending" count={stats.pending} color="#f1c40f" icon="time" />
                    <StatCard label="Rejected" count={stats.rejected} color="#e74c3c" icon="close-circle" />
                </View>

                {/* Application Form */}
                <Text style={styles.sectionHeader}>New Request</Text>
                <View style={styles.formCard}>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleLabelContainer}>
                            <Ionicons name={isFullDay ? "sunny" : "time"} size={20} color="#555" />
                            <Text style={styles.formLabel}>Full Day OD</Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#767577", true: "#d1fae5" }}
                            thumbColor={isFullDay ? "#059669" : "#f4f3f4"}
                            onValueChange={(val) => {
                                setIsFullDay(val);
                                if (!val) setToDate(fromDate);
                            }}
                            value={isFullDay}
                        />
                    </View>

                    <View style={styles.dateRow}>
                        <View style={styles.dateField}>
                            <Text style={styles.inputLabel}>From</Text>
                            <TouchableOpacity onPress={() => setShowFrom(true)} style={styles.dateInput}>
                                <Text style={styles.dateInputValue}>{fromDate.toLocaleDateString()}</Text>
                                <Ionicons name="calendar" size={18} color="#4834d4" />
                            </TouchableOpacity>
                        </View>
                        {isFullDay && (
                            <View style={styles.dateField}>
                                <Text style={styles.inputLabel}>To</Text>
                                <TouchableOpacity onPress={() => setShowTo(true)} style={styles.dateInput}>
                                    <Text style={styles.dateInputValue}>{toDate.toLocaleDateString()}</Text>
                                    <Ionicons name="calendar" size={18} color="#4834d4" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {showFrom && (<DateTimePicker value={fromDate} mode="date" display="default" onChange={onFromChange} />)}
                    {showTo && (<DateTimePicker value={toDate} mode="date" display="default" onChange={onToChange} />)}

                    {!isFullDay && (
                        <View style={styles.periodSection}>
                            <Text style={styles.inputLabel}>Select Periods</Text>
                            <View style={styles.periodGrid}>
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

                    <Text style={[styles.inputLabel, { marginTop: 15 }]}>Reason</Text>
                    <TextInput
                        style={styles.textInput}
                        multiline
                        numberOfLines={3}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Why do you need OD?"
                        placeholderTextColor="#999"
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && styles.disabledBtn]}
                        onPress={submitOD}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.submitBtnText}>Submit Application</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Recent History */}
                <Text style={styles.sectionHeader}>Recent History</Text>
                <View style={styles.historyList}>
                    {history.length > 0 ? (
                        history.map(item => renderHistoryItem(item))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No applications yet</Text>
                        </View>
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 2
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
    scrollContent: { padding: 20 },
    sectionHeader: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 15, marginTop: 5 },

    // Stats
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 16,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    iconBox: { padding: 8, borderRadius: 10, marginRight: 10 },
    statCount: { fontSize: 20, fontWeight: '800', color: '#333' },
    statLabel: { fontSize: 12, color: '#666', fontWeight: '500' },

    // Form
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    toggleLabelContainer: { flexDirection: 'row', alignItems: 'center' },
    formLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 10 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    dateField: { flex: 0.48 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        padding: 12,
    },
    dateInputValue: { fontSize: 14, fontWeight: '600', color: '#333' },
    periodSection: { marginBottom: 15 },
    periodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    periodBtn: {
        width: 40, height: 40,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    periodBtnActive: { backgroundColor: '#4834d4' },
    periodText: { fontWeight: '700', color: '#666' },
    periodTextActive: { color: '#fff' },
    textInput: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        padding: 15,
        textAlignVertical: 'top',
        fontSize: 15,
        color: '#333',
        marginBottom: 20
    },
    submitBtn: {
        backgroundColor: '#4834d4',
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4834d4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    disabledBtn: { backgroundColor: '#a0a0a0', shadowOpacity: 0 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 8 },

    // History
    historyList: {},
    historyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0'
    },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    bgGreen: { backgroundColor: '#d1fae5' },
    bgRed: { backgroundColor: '#ffe0e3' },
    bgYellow: { backgroundColor: '#fff3cd' },
    textGreen: { color: '#059669', fontSize: 11, fontWeight: '800' },
    textRed: { color: '#e11d48', fontSize: 11, fontWeight: '800' },
    textYellow: { color: '#d97706', fontSize: 11, fontWeight: '800' },
    statusText: {},
    dateText: { fontSize: 12, color: '#888' },
    historyContent: {},
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    historyDateRange: { fontSize: 14, fontWeight: '600', color: '#333' },
    historyReason: { fontSize: 13, color: '#666', lineHeight: 18 },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { color: '#aaa', marginTop: 10, fontWeight: '500' }
});

export default ODApplyScreen;
