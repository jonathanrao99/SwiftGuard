
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Image } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../supabaseClient';
import { COLORS, SPACING } from '../../../theme';

interface Incident {
    id: string;
    title: string;
    description?: string;
    severity: string;
    created_at: string;
    photo_url?: string;
    job?: { title: string };
    guard?: { full_name: string };
}

interface ClientReportsScreenProps {
    navigation: any;
}

const ClientReportsScreen = ({ navigation }: ClientReportsScreenProps) => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIncidents = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('User not logged in');
                setLoading(false);
                return;
            }

            // In a real app, you'd likely filter by jobs associated with the client
            // For now, we'll fetch all incidents where client_id matches the logged-in user
            const { data, error } = await supabase
                .from('incidents')
                .select('*, guard:guard_id(full_name), job:job_id(title)')
                .eq('client_id', user.id);

            if (error) {
                console.error('Error fetching incidents:', error.message);
            } else {
                setIncidents(data);
            }
            setLoading(false);
        };

        fetchIncidents();
    }, []);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <StatusBar translucent={false} backgroundColor={COLORS.white} barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#222" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reports</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <Text style={styles.loadingText}>Loading incidents...</Text>
                ) : incidents.length === 0 ? (
                    <Text style={styles.noIncidentsText}>No incident reports found.</Text>
                ) : (
                    incidents.map((incident) => (
                        <View key={incident.id} style={styles.incidentCard}>
                            <Text style={styles.incidentTitle}>{incident.title}</Text>
                            <Text style={styles.incidentDetail}>Job: {incident.job?.title || 'N/A'}</Text>
                            <Text style={styles.incidentDetail}>Guard: {incident.guard?.full_name || 'N/A'}</Text>
                            <Text style={styles.incidentDetail}>Severity: <Text style={{ color: incident.severity === 'High' ? '#f59e42' : (incident.severity === 'Medium' ? '#f59e42' : '#2563eb') }}>{incident.severity}</Text></Text>
                            <Text style={styles.incidentDetail}>Date: {new Date(incident.created_at).toLocaleDateString()}</Text>
                            {incident.description && <Text style={styles.incidentDescription}>{incident.description}</Text>}
                            {incident.photo_url && (
                                <Image source={{ uri: incident.photo_url }} style={styles.incidentImage} />
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#ffffff' },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: Platform.OS === 'android' ? SPACING.sm * 1.2 : SPACING.xl * 1.2,
        paddingBottom: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    headerTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textDark },
    content: {
        padding: 16,
        paddingBottom: 64,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#222',
    },
    noIncidentsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#64748b',
    },
    incidentCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    incidentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 8,
    },
    incidentDetail: {
        fontSize: 14,
        color: '#222',
        marginBottom: 4,
    },
    incidentDescription: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 8,
        lineHeight: 20,
    },
    incidentImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginTop: 12,
        resizeMode: 'cover',
    },
});

export default ClientReportsScreen;
