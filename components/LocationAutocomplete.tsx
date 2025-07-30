import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import Constants from 'expo-constants';
import { View, TextInput, Text, TouchableOpacity, FlatList, StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING } from '../theme';

type LocationAutocompleteProps = {
  onSelectAddress: (address: string) => void;
  value?: string;
};

export function LocationAutocomplete({ onSelectAddress, value }: LocationAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);

  const extra: any = (Constants as any).expoConfig?.extra || (Constants as any).manifest?.extra;
  const GOOGLE_PLACES_API_KEY = extra?.GOOGLE_PLACES_API_KEY;
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('LocationAutocomplete: Missing GOOGLE_PLACES_API_KEY in expoConfig.extra');
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      fetchControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (typeof value === 'string') {
      setQuery(value);
    }
  }, [value]);

  const handleChange = (text: string) => {
    if (typeof value !== 'string') setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (text.length > 2 && GOOGLE_PLACES_API_KEY) {
        fetchControllerRef.current?.abort();
        const controller = new AbortController();
        fetchControllerRef.current = controller;
        try {
          const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_PLACES_API_KEY}&components=country:us&types=address`;
          const res = await fetch(
            url,
            { signal: controller.signal }
          );
          const json = await res.json();
          if (json.status !== 'OK') {
            console.warn('LocationAutocomplete API error:', json.status, json.error_message);
          }
          setSuggestions(json.predictions || []);
        } catch (e) {
          const err = e as Error & { name?: string };
          if (err.name !== 'AbortError') setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    }, 400);
  };

  const handleSelect = (address: string) => {
    if (typeof value !== 'string') setQuery(address);
    setSuggestions([]);
    onSelectAddress(address);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={typeof value === 'string' ? value : query}
          onChangeText={handleChange}
          accessibilityLabel="Location input"
        />
      </View>
      {suggestions.length > 0 && (
        <FlatList
          style={styles.list}
          data={suggestions.slice(0,4)}
          keyExtractor={item => item.place_id.toString()}
          nestedScrollEnabled
          scrollEnabled={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSelect(item.description)}
              accessibilityRole="button"
              accessibilityLabel={item.description}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.itemText}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', position: 'relative', marginBottom: SPACING.sm },
  inputRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
  },
  input: {
    fontSize: 15,
    color: COLORS.textDark,
  },
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? SPACING.lg + SPACING.sm : SPACING.lg + SPACING.xs,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 10,
    maxHeight: SPACING.xl * 2,
  },
  item: { padding: SPACING.sm },
  itemText: { fontSize: 16, color: COLORS.textDark },
  list: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 10,
    maxHeight: 4 * 48,
  },
}); 