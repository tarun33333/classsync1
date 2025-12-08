import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import client from '../api/client';

const screenWidth = Dimensions.get('window').width;

const StudentSummaryScreen = () => {
    const [stats, setStats] = useState([]);
    const [graphData, setGraphData] = useState([]);
    const [selectedSem, setSelectedSem] = useState(null);
    const [userCurrentSem, setUserCurrentSem] = useState(1);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, [selectedSem]);

    const fetchStats = async () => {
        try {
            const url = selectedSem ? `/attendance/stats?semester=${selectedSem}` : '/attendance/stats';
            const res = await client.get(url);

            // 1. Process Pie Chart Data (Subject-wise)
            const chartData = res.data.stats.map((item, index) => ({
                name: item._id,
                population: item.presentCount,
                color: getRandomColor(index),
                legendFontColor: '#7F7F7F',
                legendFontSize: 15
            }));
            setStats(chartData);

            // 2. Process Line Graph Data (Semester Trends)
            if (res.data.graphData) {
                // Ensure semesters are sorted 1, 2, 3...
                const sorted = res.data.graphData.sort((a, b) => a.semester - b.semester);
                setGraphData(sorted);
            }

            // 3. Set Semesters
            if (!selectedSem) {
                setUserCurrentSem(res.data.currentSemester);
                setSelectedSem(res.data.currentSemester);
            }
        } catch (error) {
            console.log('Error fetching stats', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    };

    const getRandomColor = (index) => {
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
        return colors[index % colors.length];
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Text style={styles.title}>Academic Performance</Text>

            {/* Line Chart */}
            <View style={styles.chartContainer}>
                <Text style={styles.subtitle}>Semester Trends</Text>
                {graphData.length > 0 ? (
                    <LineChart
                        data={{
                            labels: graphData.map(g => `Sem ${g.semester}`),
                            datasets: [{
                                data: graphData.map(g => g.percentage)
                            }]
                        }}
                        width={screenWidth - 40}
                        height={220}
                        yAxisSuffix="%"
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            propsForDots: {
                                r: '6',
                                strokeWidth: '2',
                                stroke: '#2c3e50'
                            }
                        }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                        onDataPointClick={({ value, index }) => {
                            // index matches the sorted graphData array
                            const sem = graphData[index].semester;
                            Alert.alert('Semester Performance', `Semester ${sem}: ${value}% Attendance`);
                        }}
                    />
                ) : (
                    <Text style={styles.noData}>Not enough data for trends.</Text>
                )}
            </View>

            {/* Semester Selector */}
            <View style={styles.selectorContainer}>
                <Text style={styles.selectorTitle}>Select Semester Analysis:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {Array.from({ length: userCurrentSem }, (_, i) => i + 1).map(sem => (
                        <TouchableOpacity
                            key={sem}
                            style={[styles.semButton, selectedSem === sem && styles.semButtonActive]}
                            onPress={() => setSelectedSem(sem)}
                        >
                            <Text style={[styles.semText, selectedSem === sem && styles.semTextActive]}>
                                Sem {sem}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Pie Chart */}
            <View style={styles.chartContainer}>
                <Text style={styles.subtitle}>Subject Breakdown (Sem {selectedSem})</Text>
                {stats.length > 0 ? (
                    <PieChart
                        data={stats}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={{
                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        }}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />
                ) : (
                    <Text style={styles.noData}>No attendance recorded for Semester {selectedSem}.</Text>
                )}
            </View>

            <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>
                    Total Classes Attended (Sem {selectedSem}): {stats.reduce((acc, curr) => acc + curr.population, 0)}
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 15, color: '#555' },
    chartContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        elevation: 3,
        marginBottom: 20
    },
    selectorContainer: { marginBottom: 20 },
    selectorTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#444' },
    semButton: {
        backgroundColor: '#eee',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginRight: 10
    },
    semButtonActive: { backgroundColor: 'blue' },
    semText: { color: '#333', fontWeight: 'bold' },
    semTextActive: { color: '#fff' },
    noData: { textAlign: 'center', marginVertical: 20, color: '#888' },
    summaryBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        elevation: 2,
        alignItems: 'center',
        marginBottom: 40
    },
    summaryText: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' }
});

export default StudentSummaryScreen;
