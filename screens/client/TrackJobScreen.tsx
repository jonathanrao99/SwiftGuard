
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, Platform, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

const TrackJobScreen = ({ route, navigation }) => {
    const { jobId } = route.params;
    const [guardLocation, setGuardLocation] = useState(null);
    const [jobDetails, setJobDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobDetails = async () => {
            const { data, error } = await supabase
                .from('jobs')
                .select('*, guards:guard_id(full_name)')
                .eq('id', jobId)
                .single();

            if (error) {
                console.error('Error fetching job details:', error.message);
            } else {
                setJobDetails(data);
                if (data.guard_latitude && data.guard_longitude) {
                    setGuardLocation({
                        latitude: data.guard_latitude,
                        longitude: data.guard_longitude,
                    });
                }
            }
            setLoading(false);
        };

        fetchJobDetails();

        // Set up real-time subscription for guard location updates
        const subscription = supabase
            .channel('guard_location_updates')
            .on('postgres_changes', 
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'jobs',
                    filter: `id=eq.${jobId}`
                }, 
                (payload) => {
                    const newData = payload.new;
                    if (newData.guard_latitude && newData.guard_longitude) {
                        setGuardLocation({
                            latitude: newData.guard_latitude,
                            longitude: newData.guard_longitude,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [jobId]);

    const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

    return (
        <View style={[styles.container, { paddingTop: statusBarHeight }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#222" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Track Job: {jobDetails?.title}</Text>
                <View style={{ width: 24 }} />
            </View>

            {guardLocation ? (
                <View style={styles.mapPlaceholder}>
                    <MaterialIcons name="location-on" size={64} color="#2563eb" />
                    <Text style={styles.locationTitle}>Guard Location</Text>
                    <Text style={styles.coordinates}>
                        Lat: {guardLocation.latitude.toFixed(6)}
                    </Text>
                    <Text style={styles.coordinates}>
                        Lng: {guardLocation.longitude.toFixed(6)}
                    </Text>
                    <Text style={styles.guardName}>
                        {jobDetails?.guards?.full_name || 'Guard'}
                    </Text>
                    <Text style={styles.mapNote}>
                        Map view temporarily unavailable
                    </Text>
                </View>
            ) : (
                <View style={styles.noLocationContainer}>
                    <MaterialIcons name="location-off" size={64} color="#64748b" />
                    <Text style={styles.noLocationText}>Guard location not available yet.</Text>
                    <Text style={styles.noLocationSubText}>Please ensure the guard has started tracking.</Text>
                </View>
            )}
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
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8fafc',
    },
    locationTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#222',
        marginTop: 16,
        marginBottom: 8,
    },
    coordinates: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 4,
        fontFamily: 'monospace',
    },
    guardName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2563eb',
        marginTop: 16,
    },
    mapNote: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 24,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    noLocationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noLocationText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#222',
        marginTop: 16,
        marginBottom: 10,
    },
    noLocationSubText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
});

export default TrackJobScreen;
