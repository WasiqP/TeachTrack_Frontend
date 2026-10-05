import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FormData {
  id: string;
  name: string;
  iconId: string;
  answers: any;
  createdAt: string;
}

interface FormsContextType {
  forms: FormData[];
  addForm: (form: FormData) => Promise<void>;
  updateForm: (id: string, updates: Partial<FormData>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  isLoading: boolean;
}

const FormsContext = createContext<FormsContextType | undefined>(undefined);

export const FormsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const storedForms = await AsyncStorage.getItem('forms');
      if (storedForms) {
        setForms(JSON.parse(storedForms));
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addForm = async (form: FormData) => {
    try {
      const updatedForms = [form, ...forms];
      setForms(updatedForms);
      await AsyncStorage.setItem('forms', JSON.stringify(updatedForms));
    } catch (error) {
      console.error('Error saving form:', error);
    }
  };

  const updateForm = async (id: string, updates: Partial<FormData>) => {
    try {
      const updatedForms = forms.map(form => 
        form.id === id ? { ...form, ...updates } : form
      );
      setForms(updatedForms);
      await AsyncStorage.setItem('forms', JSON.stringify(updatedForms));
    } catch (error) {
      console.error('Error updating form:', error);
    }
  };

  const deleteForm = async (id: string) => {
    try {
      const updatedForms = forms.filter(form => form.id !== id);
      setForms(updatedForms);
      await AsyncStorage.setItem('forms', JSON.stringify(updatedForms));
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  return (
    <FormsContext.Provider value={{ forms, addForm, updateForm, deleteForm, isLoading }}>
      {children}
    </FormsContext.Provider>
  );
};

export const useForms = () => {
  const context = useContext(FormsContext);
  if (!context) {
    throw new Error('useForms must be used within a FormsProvider');
  }
  return context;
};

