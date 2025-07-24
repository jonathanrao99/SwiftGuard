import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StatusBar, Alert } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';
import NetInfo from '@react-native-community/netinfo';
import { storePendingMessage } from '../../services/OfflineSyncService';

export default function GuardChatScreen({ route, navigation }) {
  const { thread } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        // Fetch initial messages for this job/thread
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:sender_id(full_name), receiver:receiver_id(full_name)')
          .eq('job_id', thread.job_id) // Assuming thread.job_id is passed for job-specific chats
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error.message);
        } else {
          setMessages(data);
        }
      }
    };

    fetchUserAndMessages();

    // Set up Realtime subscription
    const messagesSubscription = supabase
      .channel(`job_chat_${thread.job_id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${thread.job_id}` },
        (payload) => {
          // Fetch sender/receiver details for the new message
          supabase.from('messages').select('*, sender:sender_id(full_name), receiver:receiver_id(full_name)').eq('id', payload.new.id).single()
            .then(({ data, error }) => {
              if (error) console.error('Error fetching new message details:', error);
              else setMessages(prev => [...prev, data]);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [thread.job_id]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !currentUserId) return;

    const messageData = {
      sender_id: currentUserId,
      receiver_id: thread.other_user_id, // Assuming thread.other_user_id is passed
      job_id: thread.job_id,
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    const state = await NetInfo.fetch();

    if (state.isConnected) {
      const { error } = await supabase.from('messages').insert([messageData]);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setInput('');
      }
    } else {
      await storePendingMessage(messageData);
      Alert.alert('Offline', 'Message stored offline and will be synced when online.');
      setInput('');
      // Optimistically add to UI
      setMessages(prev => [...prev, { ...messageData, sender: { full_name: 'You' }, receiver: { full_name: 'Them' } }]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent={false} backgroundColor="#ffffff" barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{thread.name}</Text>
      </View>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.bubble, msg.sender_id === currentUserId ? styles.myBubble : styles.theirBubble]}>
            <Text style={styles.senderName}>{msg.sender.full_name}</Text>
            <Text style={[styles.bubbleText, msg.sender_id === currentUserId ? styles.myText : styles.theirText]}>{msg.content}</Text>
            <Text style={styles.timestamp}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        ))}
      </ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message"
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn} activeOpacity={0.7}>
            <Feather name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'android' ? 24 : 44, paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  backBtn: { paddingRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  messagesContainer: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 80 },
  bubble: { padding: 12, borderRadius: 16, marginVertical: 4, maxWidth: '80%' },
  myBubble: { backgroundColor: '#2563eb', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  theirBubble: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  bubbleText: { fontSize: 14 },
  myText: { color: '#fff' },
  theirText: { color: '#111827' },
  senderName: { fontSize: 10, color: '#64748b', marginBottom: 2 },
  timestamp: { fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: 'right' },
  inputRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, color: '#111827' },
  sendBtn: { marginLeft: 12, backgroundColor: '#2563eb', borderRadius: 20, padding: 10 },
}); 