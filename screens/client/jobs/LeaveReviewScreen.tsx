
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { supabase } from '../../../supabaseClient';

const LeaveReviewScreen = ({ route, navigation }) => {
    const { jobId, guardId } = route.params;
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');

    const handleSubmit = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            Alert.alert('Error', 'You must be logged in to leave a review.');
            return;
        }

        const { error } = await supabase
            .from('reviews')
            .insert([
                {
                    job_id: jobId,
                    guard_id: guardId,
                    client_id: user.id,
                    rating: rating,
                    review_text: reviewText,
                },
            ]);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Your review has been submitted.');
            navigation.goBack();
        }
    };

    return (
        <>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <View style={styles.container}>
                <Text style={styles.title}>Leave a Review</Text>
                <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setRating(star)}>
                            <Text style={rating >= star ? styles.starFilled : styles.starEmpty}>★</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Write your review here..."
                    value={reviewText}
                    onChangeText={setReviewText}
                    multiline
                />
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Submit Review</Text>
                </TouchableOpacity>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 20,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    starFilled: {
        fontSize: 40,
        color: '#2563eb',
    },
    starEmpty: {
        fontSize: 40,
        color: '#64748b',
    },
    input: {
        borderWidth: 1,
        borderColor: '#64748b',
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default LeaveReviewScreen;
