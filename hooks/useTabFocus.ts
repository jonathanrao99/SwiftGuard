import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export const useTabFocus = () => {
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  return isFocused;
}; 