import React, { createContext, useContext, useState } from 'react';

interface TabBarVisibilityContextType {
  isScrolledDown: boolean;
  setIsScrolledDown: (v: boolean) => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityContextType>({
  isScrolledDown: false,
  setIsScrolledDown: () => {},
});

export const useTabBarVisibility = () => useContext(TabBarVisibilityContext);

export const TabBarVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  return (
    <TabBarVisibilityContext.Provider value={{ isScrolledDown, setIsScrolledDown }}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}; 