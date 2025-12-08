import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
    const { logout, userInfo, userRole } = useContext(AuthContext);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {userInfo?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Name</Text>
                    <Text style={styles.value}>{userInfo?.name}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{userInfo?.email}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Role</Text>
                    <Text style={styles.value}>{userRole ? userRole.toUpperCase() : ''}</Text>
                </View>

                {userRole === 'student' && (
                    <>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Roll Number</Text>
                            <Text style={styles.value}>{userInfo?.rollNumber}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Department</Text>
                            <Text style={styles.value}>{userInfo?.department}</Text>
                        </View>
                    </>
                )}

                {userRole === 'teacher' && (
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Department</Text>
                        <Text style={styles.value}>{userInfo?.department}</Text>
                    </View>
                )}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20
    },
    header: {
        marginBottom: 30,
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333'
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 30
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 20
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: {
        fontSize: 32,
        color: 'white',
        fontWeight: 'bold'
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    label: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500'
    },
    value: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold'
    },
    logoutButton: {
        backgroundColor: '#dc3545',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center'
    },
    logoutText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    }
});

export default ProfileScreen;
