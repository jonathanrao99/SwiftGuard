
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';
import { theme } from '../../theme';

const GuardEarningsScreen = ({ navigation }) => {
    const [totalEarned, setTotalEarned] = useState(0);
    const [jobCount, setJobCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEarningsData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('User not logged in');
                setLoading(false);
                return;
            }

            // Fetch jobs where the guard was assigned and the job is completed
            // In a real scenario, you'd have a more robust way to track guard earnings per job
            // For simplicity, we'll assume a fixed earning per job or fetch from a 'guard_job_assignments' table
            const { data: jobs, error } = await supabase
                .from('jobs')
                .select('totalAmount') // Assuming totalAmount is what guard earns, adjust as per your payout logic
                .eq('guard_id', user.id) // This assumes a single guard per job, or you need to join a job_guards table
                .eq('status', 'completed');

            if (error) {
                console.error('Error fetching earnings data:', error.message);
            } else {
                const sum = jobs.reduce((acc, job) => acc + (job.totalAmount || 0), 0);
                setTotalEarned(sum);
                setJobCount(jobs.length);
            }
            setLoading(false);
        };

        fetchEarningsData();
    }, []);

    const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

    return (
        <View style={[styles.container, { paddingTop: statusBarHeight }]}>
            <StatusBar translucent={false} backgroundColor="#f3f4f6" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#222" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Earnings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
                ) : (
                    <View style={styles.analyticsCard}>
                        <Text style={styles.cardTitle}>Total Earned</Text>
                        <Text style={styles.totalAmount}>${totalEarned.toFixed(2)}</Text>
                        <Text style={styles.cardSubtitle}>From {jobCount} completed jobs</Text>

                        {/* Placeholder for more detailed charts/graphs */}
                        <View style={styles.chartPlaceholder}>
                            <MaterialIcons name="bar-chart" size={80} color="#64748b" />
                            <Text style={styles.chartText}>Charts and detailed trends coming soon!</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#222',
    },
    content: {
        padding: 16,
        paddingBottom: 64,
    },
    analyticsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 5,
    },
    totalAmount: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 5,
    },
    cardSubtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 20,
    },
    chartPlaceholder: {
        marginTop: 30,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#e0f2fe',
        borderRadius: 10,
        width: '100%',
    },
    chartText: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 10,
        textAlign: 'center',
    },
});

export default GuardEarningsScreen;
