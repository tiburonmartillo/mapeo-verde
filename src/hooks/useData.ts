import { useContext } from 'react';
import { DataContext, DataContextType } from '../context/DataContext';

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
