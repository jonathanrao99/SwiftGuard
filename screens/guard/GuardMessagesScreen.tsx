import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';

export default function GuardMessagesScreen({ navigation }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all messages where the current user is either sender or receiver
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, sender:sender_id(full_name, avatar_url), receiver:receiver_id(full_name, avatar_url), job:job_id(title)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error.message);
        setLoading(false);
        return;
      }

      // Group messages into threads
      const groupedThreads = {};
      messages.forEach(msg => {
        const otherParticipant = msg.sender_id === user.id ? msg.receiver : msg.sender;
        const threadKey = `${msg.job_id || 'no_job'}-${otherParticipant.id}`;

        if (!groupedThreads[threadKey]) {
          groupedThreads[threadKey] = {
            id: threadKey,
            name: msg.job?.title ? `${msg.job.title} - ${otherParticipant.full_name}` : otherParticipant.full_name,
            lastMessage: msg.content,
            time: msg.created_at,
            avatar: otherParticipant.avatar_url,
            job_id: msg.job_id,
            other_user_id: otherParticipant.id,
          };
        } else if (new Date(msg.created_at) > new Date(groupedThreads[threadKey].time)) {
          // Update with the latest message
          groupedThreads[threadKey].lastMessage = msg.content;
          groupedThreads[threadKey].time = msg.created_at;
        }
      });

      setThreads(Object.values(groupedThreads).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
      setLoading(false);
    };

    fetchThreads();

    // Realtime subscription for new messages to update threads
    const messagesSubscription = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Re-fetch threads on new message to update the list
          fetchThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Text style={styles.header}>Messages</Text>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.loadingText}>Loading messages...</Text>
        ) : threads.length === 0 ? (
          <Text style={styles.noMessagesText}>No messages yet.</Text>
        ) : (
          threads.map(thread => (
            <TouchableOpacity
              key={thread.id}
              style={styles.thread}
              onPress={() => navigation.navigate('GuardChat', { thread })}
              activeOpacity={0.8}
            >
              <Image source={{ uri: thread.avatar }} style={styles.avatar} />
              <View style={styles.textContainer}>
                <Text style={styles.name}>{thread.name}</Text>
                <Text style={styles.message} numberOfLines={1}>{thread.lastMessage}</Text>
              </View>
              <Text style={styles.time}>{new Date(thread.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Feather name="chevron-right" size={20} color="#64748b" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#111827', alignSelf: 'center', marginTop: 16 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  thread: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  textContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  message: { fontSize: 14, color: '#64748b', marginTop: 2 },
  time: { fontSize: 12, color: '#94a3b8', marginRight: 8 },
  loadingText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#64748b' },
  noMessagesText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#64748b' },
}); 