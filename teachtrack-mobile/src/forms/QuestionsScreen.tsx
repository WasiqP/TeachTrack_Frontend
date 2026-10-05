import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  Switch,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { useThemeMode } from '../theme';
import { useForms } from '../context/FormsContext';
import { usePulseAlert } from '../context/AlertModalContext';
import { PulseScrollView } from '../components/PulseScrollView';
import BackButton from '../components/Reusable-Components/BackButton';
import ImageIcon from '../../assets/images/image.svg';
import RazerAudioIcon from '../../assets/images/razer-audio.svg';
import ShortTextIcon from '../../assets/images/short-text.svg';
import LongTextIcon from '../../assets/images/long-text.svg';
import McqIcon from '../../assets/images/mcq.svg';
import DropdownIcon from '../../assets/images/dropdown.svg';
import CheckboxesIcon from '../../assets/images/checkboxes.svg';
import RatingIcon from '../../assets/images/rating.svg';
import DateIcon from '../../assets/images/date.svg';
import NumberIcon from '../../assets/images/number.svg';
import EmailIcon from '../../assets/images/email.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'QuestionsScreen'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type QuestionType = 
  | 'shortText' 
  | 'longText' 
  | 'multipleChoice' 
  | 'checkbox' 
  | 'dropdown' 
  | 'rating' 
  | 'email' 
  | 'number' 
  | 'date';

export interface QuestionData {
  id: string;
  title: string;
  type: QuestionType;
  required: boolean;
  placeholder?: string;
  description?: string;
  maxLength?: number;
  options?: string[];
  correctAnswers?: number[]; // Array of option indices (for checkboxes: multiple, for multipleChoice/dropdown: single item)
  imageUrl?: string;
  audioUrl?: string;
  // Rating specific
  maxRating?: number;
  // Number specific
  min?: number;
  max?: number;
  step?: number;
  // Date specific
  dateFormat?: string;
  minDate?: string;
  maxDate?: string;
}

const QUESTION_TYPES: { id: QuestionType; label: string }[] = [
  { id: 'shortText', label: 'Short Answer' },
  { id: 'longText', label: 'Long Answer' },
  { id: 'multipleChoice', label: 'Multiple Choice' },
  { id: 'checkbox', label: 'Checkboxes' },
  { id: 'dropdown', label: 'Dropdown' },
  { id: 'rating', label: 'Rating' },
  { id: 'email', label: 'Email' },
  { id: 'number', label: 'Number' },
  { id: 'date', label: 'Date' },
];

const renderQuestionTypeIcon = (type: QuestionType, size: number = 24) => {
  const iconProps = { width: size, height: size, stroke: '#000000' };
  switch (type) {
    case 'shortText':
      return <ShortTextIcon {...iconProps} />;
    case 'longText':
      return <LongTextIcon {...iconProps} />;
    case 'multipleChoice':
      return <McqIcon {...iconProps} />;
    case 'checkbox':
      return <CheckboxesIcon {...iconProps} />;
    case 'dropdown':
      return <DropdownIcon {...iconProps} />;
    case 'rating':
      return <RatingIcon {...iconProps} />;
    case 'email':
      return <EmailIcon {...iconProps} />;
    case 'number':
      return <NumberIcon {...iconProps} />;
    case 'date':
      return <DateIcon {...iconProps} />;
    default:
      return null;
  }
};

const QuestionsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { ink, theme } = useThemeMode();
  const { formId, questionId } = route.params;
  const { forms, updateForm } = useForms();
  const { showAlert } = usePulseAlert();
  const form = forms.find(f => f.id === formId);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [questionData, setQuestionData] = useState<QuestionData>({
    id: questionId,
    title: '',
    type: 'shortText',
    required: true,
    placeholder: '',
    description: '',
    maxLength: undefined,
    options: [],
    correctAnswers: [],
    imageUrl: undefined,
    audioUrl: undefined,
    maxRating: 5,
    min: undefined,
    max: undefined,
    step: undefined,
    dateFormat: 'MM/DD/YYYY',
    minDate: undefined,
    maxDate: undefined,
  });

  const [newOption, setNewOption] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);

  useEffect(() => {
    // Load existing question data if available
    if (form?.answers?.questions) {
      const questions = form.answers.questions as QuestionData[];
      const existing = questions.find(q => q.id === questionId);
      if (existing) {
        setQuestionData(existing);
      }
    }
  }, [form, questionId]);

  useFocusEffect(
    React.useCallback(() => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim])
  );

  const handleSave = async () => {
    if (!questionData.title.trim()) {
      showAlert({
        variant: 'warning',
        title: 'Required Field',
        message: 'Please enter a question title',
      });
      return;
    }

    if (form) {
      const questions = (form.answers?.questions as QuestionData[]) || [];
      const existingIndex = questions.findIndex(q => q.id === questionId);
      
      const updated = existingIndex >= 0
        ? questions.map((q, i) => i === existingIndex ? questionData : q)
        : [...questions, questionData];

      await updateForm(formId, {
        answers: {
          ...form.answers,
          questions: updated,
        },
      });

      navigation.goBack();
    }
  };

  const addOption = () => {
    if (newOption.trim() && questionData.options) {
      setQuestionData(prev => ({
        ...prev,
        options: [...(prev.options || []), newOption.trim()],
      }));
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    if (questionData.options) {
      setQuestionData(prev => {
        const newOptions = prev.options?.filter((_, i) => i !== index) || [];
        // Remove correct answer if the option is deleted and adjust indices
        const newCorrectAnswers = (prev.correctAnswers || [])
          .filter(correctIndex => correctIndex !== index)
          .map(correctIndex => correctIndex > index ? correctIndex - 1 : correctIndex);
        
        return {
          ...prev,
          options: newOptions,
          correctAnswers: newCorrectAnswers,
        };
      });
    }
  };

  const toggleCorrectAnswer = (index: number) => {
    setQuestionData(prev => {
      const currentCorrectAnswers = prev.correctAnswers || [];
      const isCurrentlyCorrect = currentCorrectAnswers.includes(index);
      
      // For dropdown, only allow one correct answer
      if (prev.type === 'dropdown') {
        if (isCurrentlyCorrect) {
          // Remove if already correct
          return {
            ...prev,
            correctAnswers: [],
          };
        } else {
          // Set this as the only correct answer
          return {
            ...prev,
            correctAnswers: [index],
          };
        }
      } else {
        // For multiple choice and checkboxes, allow multiple correct answers
        if (isCurrentlyCorrect) {
          return {
            ...prev,
            correctAnswers: currentCorrectAnswers.filter(i => i !== index),
          };
        } else {
          return {
            ...prev,
            correctAnswers: [...currentCorrectAnswers, index],
          };
        }
      }
    });
  };

  const needsOptions = ['multipleChoice', 'checkbox', 'dropdown'].includes(questionData.type);
  const needsPlaceholder = ['shortText', 'longText', 'email'].includes(questionData.type);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: ink.canvas,
        },
        header: {
          paddingTop: 70,
          paddingHorizontal: 24,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderColor: theme.border,
          flexDirection: 'row',
          alignItems: 'center',
        },
        backBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: ink.borderInk,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        },
        headerCenter: {
          flex: 1,
          alignItems: 'center',
        },
        screenTitle: {
          fontSize: 16,
          fontWeight: '700',
          fontFamily: 'Outfit-Bold',
          color: ink.ink,
        },
        saveHeaderBtn: {
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        saveHeaderText: {
          fontSize: 16,
          fontFamily: 'DMSans-SemiBold',
          color: theme.primary,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          padding: 20,
          paddingBottom: 80,
        },
        section: {
          marginBottom: 24,
        },
        sectionLabel: {
          fontSize: 14,
          fontFamily: 'DMSans-SemiBold',
          color: ink.ink,
          marginBottom: 10,
        },
        textInput: {
          backgroundColor: theme.backgroundAlt,
          borderWidth: 1,
          borderColor: ink.borderInk,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 16,
          fontFamily: 'DMSans-Regular',
          color: ink.ink,
          minHeight: 48,
        },
        textArea: {
          minHeight: 100,
          textAlignVertical: 'top',
        },
        typeSelector: {
          backgroundColor: theme.backgroundAlt,
          borderWidth: 1,
          borderColor: ink.borderInk,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        typeSelectorLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        typeSelectorText: {
          fontSize: 16,
          fontFamily: 'DMSans-Medium',
          color: ink.ink,
          marginLeft: 12,
        },
        chevron: {
          fontSize: 24,
          color: ink.ink,
        },
        optionsHeader: {
          marginBottom: 10,
        },
        correctAnswerHint: {
          fontSize: 12,
          fontFamily: 'DMSans-Regular',
          color: ink.inkSoft,
          marginTop: 4,
          fontStyle: 'italic',
        },
        optionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.backgroundAlt,
          borderWidth: 1,
          borderColor: ink.borderInk,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginBottom: 10,
        },
        optionRowCorrect: {
          backgroundColor: '#F0F8FF',
          borderColor: '#4CAF50',
          borderWidth: 2,
        },
        correctAnswerBtn: {
          marginRight: 12,
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
        correctAnswerCheckbox: {
          width: 24,
          height: 24,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: ink.borderInk,
          backgroundColor: ink.canvas,
          alignItems: 'center',
          justifyContent: 'center',
        },
        correctAnswerCheckboxChecked: {
          backgroundColor: '#4CAF50',
          borderColor: '#4CAF50',
        },
        correctAnswerCheck: {
          fontSize: 16,
          color: theme.white,
          fontWeight: 'bold',
        },
        optionText: {
          flex: 1,
          fontSize: 15,
          fontFamily: 'DMSans-Regular',
          color: ink.ink,
        },
        optionTextCorrect: {
          fontFamily: 'DMSans-SemiBold',
          color: '#2E7D32',
        },
        removeOptionBtn: {
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.border,
        },
        removeOptionText: {
          fontSize: 20,
          color: ink.ink,
          lineHeight: 22,
        },
        addOptionRow: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 8,
        },
        optionInput: {
          flex: 1,
          backgroundColor: theme.backgroundAlt,
          borderWidth: 1,
          borderColor: ink.borderInk,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          fontFamily: 'DMSans-Regular',
          color: ink.ink,
        },
        addOptionBtn: {
          backgroundColor: ink.ink,
          borderRadius: 10,
          paddingHorizontal: 20,
          paddingVertical: 12,
          justifyContent: 'center',
        },
        addOptionText: {
          fontSize: 15,
          fontFamily: 'DMSans-SemiBold',
          color: theme.white,
        },
        settingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.backgroundAlt,
          borderWidth: 1,
          borderColor: ink.borderInk,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        settingLeft: {
          flex: 1,
          marginRight: 16,
        },
        settingLabel: {
          fontSize: 16,
          fontFamily: 'DMSans-Medium',
          color: ink.ink,
          marginBottom: 4,
        },
        settingDesc: {
          fontSize: 12,
          fontFamily: 'DMSans-Regular',
          color: ink.inkSoft,
        },
        mediaBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.backgroundAlt,
          borderWidth: 1,
          borderColor: ink.borderInk,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          marginBottom: 12,
        },
        mediaContent: {
          flex: 1,
          marginLeft: 14,
        },
        mediaLabel: {
          fontSize: 16,
          fontFamily: 'DMSans-Medium',
          color: ink.ink,
          marginBottom: 4,
        },
        mediaDesc: {
          fontSize: 12,
          fontFamily: 'DMSans-Regular',
          color: ink.inkSoft,
        },
        mediaCheck: {
          fontSize: 20,
          color: ink.ink,
          fontWeight: 'bold',
        },
        saveBtn: {
          backgroundColor: ink.ink,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: 20,
        },
        saveBtnText: {
          fontSize: 16,
          fontFamily: 'DMSans-SemiBold',
          color: theme.white,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        modalContent: {
          backgroundColor: theme.card,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: ink.borderInk,
          width: '90%',
          maxHeight: '70%',
          paddingVertical: 20,
          shadowColor: ink.ink,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        modalTitle: {
          fontSize: 18,
          fontFamily: 'Outfit-Bold',
          color: ink.ink,
          textAlign: 'center',
          marginBottom: 16,
          paddingHorizontal: 20,
        },
        typeList: {
          maxHeight: 400,
        },
        typeOption: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        typeOptionSelected: {
          backgroundColor: theme.backgroundAlt,
        },
        typeOptionIcon: {
          marginRight: 14,
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
        typeOptionLabel: {
          flex: 1,
          fontSize: 16,
          fontFamily: 'DMSans-Medium',
          color: ink.ink,
        },
        typeOptionLabelSelected: {
          fontFamily: 'DMSans-SemiBold',
          color: ink.ink,
        },
        typeOptionCheck: {
          fontSize: 20,
          color: ink.ink,
          fontWeight: 'bold',
        },
        ratingOptions: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 8,
        },
        ratingOption: {
          width: 50,
          height: 50,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: ink.borderInk,
          backgroundColor: theme.backgroundAlt,
          alignItems: 'center',
          justifyContent: 'center',
        },
        ratingOptionSelected: {
          backgroundColor: ink.ink,
        },
        ratingOptionText: {
          fontSize: 18,
          fontFamily: 'DMSans-SemiBold',
          color: ink.ink,
        },
        ratingOptionTextSelected: {
          color: theme.white,
        },
        helperText: {
          fontSize: 12,
          fontFamily: 'DMSans-Regular',
          color: ink.inkSoft,
          marginTop: 8,
        },
        numberRow: {
          flexDirection: 'row',
          gap: 10,
          marginBottom: 8,
        },
        numberInputContainer: {
          flex: 1,
        },
        numberLabel: {
          fontSize: 12,
          fontFamily: 'DMSans-Medium',
          color: ink.ink,
          marginBottom: 8,
        },
        numberInput: {
          backgroundColor: theme.backgroundAlt,
          borderWidth: 1,
          borderColor: ink.borderInk,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          fontSize: 16,
          fontFamily: 'DMSans-Regular',
          color: ink.ink,
          minHeight: 48,
        },
        dateFormatOptions: {
          flexDirection: 'row',
          gap: 10,
          marginBottom: 16,
        },
        dateFormatOption: {
          flex: 1,
          backgroundColor: theme.backgroundAlt,
          borderWidth: 1,
          borderColor: ink.borderInk,
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        dateFormatOptionSelected: {
          backgroundColor: ink.ink,
        },
        dateFormatOptionText: {
          fontSize: 14,
          fontFamily: 'DMSans-Medium',
          color: ink.ink,
        },
        dateFormatOptionTextSelected: {
          color: theme.white,
        },
        dateRow: {
          gap: 12,
        },
        dateInputContainer: {
          marginBottom: 0,
        },
        infoBox: {
          backgroundColor: theme.primarySoft,
          borderWidth: 1,
          borderColor: theme.primary,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        infoText: {
          fontSize: 14,
          fontFamily: 'DMSans-Regular',
          color: ink.inkSoft,
          lineHeight: 20,
        },
      }),
    [ink, theme],
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          size={16}
          stroke="#000000"
          rippleColor="rgba(0,0,0,0.06)"
        />
        <View style={styles.headerCenter}>
          <Text style={styles.screenTitle}>Edit Question</Text>
        </View>
        <Pressable onPress={handleSave} style={styles.saveHeaderBtn}>
          <Text style={styles.saveHeaderText}>Save</Text>
        </Pressable>
      </View>

      <PulseScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Title */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Question Title *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your question..."
            placeholderTextColor={ink.placeholder}
            value={questionData.title}
            onChangeText={(text) => setQuestionData(prev => ({ ...prev, title: text }))}
            multiline
          />
        </View>

        {/* Question Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Question Type</Text>
          <Pressable 
            style={styles.typeSelector}
            onPress={() => setShowTypeModal(true)}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <View style={styles.typeSelectorLeft}>
              {renderQuestionTypeIcon(questionData.type, 20)}
              <Text style={styles.typeSelectorText}>
                {QUESTION_TYPES.find(t => t.id === questionData.type)?.label}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Add a helpful description or hint..."
            placeholderTextColor={ink.placeholder}
            value={questionData.description}
            onChangeText={(text) => setQuestionData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Placeholder - Only for text-based inputs */}
        {needsPlaceholder && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Placeholder Text (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter placeholder text..."
              placeholderTextColor={ink.placeholder}
              value={questionData.placeholder}
              onChangeText={(text) => setQuestionData(prev => ({ ...prev, placeholder: text }))}
            />
          </View>
        )}

        {/* Options for Multiple Choice, Checkbox, Dropdown */}
        {needsOptions && (
          <View style={styles.section}>
            <View style={styles.optionsHeader}>
              <Text style={styles.sectionLabel}>Options</Text>
              <Text style={styles.correctAnswerHint}>
                {questionData.type === 'dropdown'
                  ? 'Tap ✓ to mark the correct answer'
                  : 'Tap ✓ to mark correct answers (multiple allowed)'}
              </Text>
            </View>
            {questionData.options?.map((option, index) => {
              const isCorrect = questionData.correctAnswers?.includes(index) || false;
              return (
                <View key={index} style={[
                  styles.optionRow,
                  isCorrect && styles.optionRowCorrect
                ]}>
                  <Pressable
                    onPress={() => toggleCorrectAnswer(index)}
                    style={styles.correctAnswerBtn}
                    android_ripple={{ color: 'rgba(160,96,255,0.12)', borderless: true }}
                  >
                    <View style={[
                      styles.correctAnswerCheckbox,
                      isCorrect && styles.correctAnswerCheckboxChecked
                    ]}>
                      {isCorrect && <Text style={styles.correctAnswerCheck}>✓</Text>}
                    </View>
                  </Pressable>
                  <Text style={[styles.optionText, isCorrect && styles.optionTextCorrect]}>
                    {option}
                  </Text>
                  <Pressable 
                    onPress={() => removeOption(index)}
                    style={styles.removeOptionBtn}
                    android_ripple={{ color: 'rgba(160,96,255,0.12)', borderless: true }}
                  >
                    <Text style={styles.removeOptionText}>×</Text>
                  </Pressable>
                </View>
              );
            })}
            <View style={styles.addOptionRow}>
              <TextInput
                style={styles.optionInput}
                placeholder="Add option..."
                placeholderTextColor={ink.placeholder}
                value={newOption}
                onChangeText={setNewOption}
                onSubmitEditing={addOption}
              />
              <Pressable 
                style={styles.addOptionBtn}
                onPress={addOption}
                android_ripple={{ color: 'rgba(160,96,255,0.12)' }}
              >
                <Text style={styles.addOptionText}>Add</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Max Length for Text Inputs */}
        {(questionData.type === 'shortText' || questionData.type === 'longText') && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Character Limit (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 500"
              placeholderTextColor={ink.placeholder}
              value={questionData.maxLength?.toString() || ''}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                setQuestionData(prev => ({ 
                  ...prev, 
                  maxLength: text === '' ? undefined : (isNaN(num) ? undefined : num)
                }));
              }}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Rating Settings */}
        {questionData.type === 'rating' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Maximum Rating</Text>
            <View style={styles.ratingOptions}>
              {[3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <Pressable
                  key={rating}
                  style={[
                    styles.ratingOption,
                    questionData.maxRating === rating && styles.ratingOptionSelected
                  ]}
                  onPress={() => setQuestionData(prev => ({ ...prev, maxRating: rating }))}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                >
                  <Text style={[
                    styles.ratingOptionText,
                    questionData.maxRating === rating && styles.ratingOptionTextSelected
                  ]}>
                    {rating}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.helperText}>Select the maximum rating value (e.g., 5 for 5-star rating)</Text>
          </View>
        )}

        {/* Number Settings */}
        {questionData.type === 'number' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Number Constraints (Optional)</Text>
            
            <View style={styles.numberRow}>
              <View style={styles.numberInputContainer}>
                <Text style={styles.numberLabel}>Minimum</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="Min"
                  placeholderTextColor={ink.placeholder}
                  value={questionData.min?.toString() || ''}
                  onChangeText={(text) => {
                    const num = parseFloat(text);
                    setQuestionData(prev => ({ 
                      ...prev, 
                      min: text === '' ? undefined : (isNaN(num) ? undefined : num)
                    }));
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.numberInputContainer}>
                <Text style={styles.numberLabel}>Maximum</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="Max"
                  placeholderTextColor={ink.placeholder}
                  value={questionData.max?.toString() || ''}
                  onChangeText={(text) => {
                    const num = parseFloat(text);
                    setQuestionData(prev => ({ 
                      ...prev, 
                      max: text === '' ? undefined : (isNaN(num) ? undefined : num)
                    }));
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.numberInputContainer}>
                <Text style={styles.numberLabel}>Step</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="1"
                  placeholderTextColor={ink.placeholder}
                  value={questionData.step?.toString() || ''}
                  onChangeText={(text) => {
                    const num = parseFloat(text);
                    setQuestionData(prev => ({ 
                      ...prev, 
                      step: text === '' ? undefined : (isNaN(num) ? undefined : num)
                    }));
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Text style={styles.helperText}>Set minimum, maximum, and step values for number input</Text>
          </View>
        )}

        {/* Date Settings */}
        {questionData.type === 'date' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date Format</Text>
            <View style={styles.dateFormatOptions}>
              {[
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
              ].map((format) => (
                <Pressable
                  key={format.value}
                  style={[
                    styles.dateFormatOption,
                    questionData.dateFormat === format.value && styles.dateFormatOptionSelected
                  ]}
                  onPress={() => setQuestionData(prev => ({ ...prev, dateFormat: format.value }))}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                >
                  <Text style={[
                    styles.dateFormatOptionText,
                    questionData.dateFormat === format.value && styles.dateFormatOptionTextSelected
                  ]}>
                    {format.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.numberLabel}>Minimum Date (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={ink.placeholder}
                  value={questionData.minDate || ''}
                  onChangeText={(text) => setQuestionData(prev => ({ ...prev, minDate: text }))}
                />
              </View>

              <View style={styles.dateInputContainer}>
                <Text style={styles.numberLabel}>Maximum Date (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={ink.placeholder}
                  value={questionData.maxDate || ''}
                  onChangeText={(text) => setQuestionData(prev => ({ ...prev, maxDate: text }))}
                />
              </View>
            </View>
            <Text style={styles.helperText}>Set date format and optional date range constraints</Text>
          </View>
        )}

        {/* Email Info */}
        {questionData.type === 'email' && (
          <View style={styles.section}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>ℹ️ Email validation will be automatically applied to ensure valid email format.</Text>
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Settings</Text>
          
          {/* Required Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Required</Text>
              <Text style={styles.settingDesc}>User must answer this question</Text>
            </View>
            <Switch
              value={questionData.required}
              onValueChange={(value) => setQuestionData(prev => ({ ...prev, required: value }))}
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Media Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Media (Optional)</Text>
          
          {/* Image Upload */}
          <Pressable 
            style={styles.mediaBtn}
            onPress={() =>
              showAlert({
                variant: 'info',
                title: 'Image Upload',
                message: 'Image upload functionality coming soon.',
              })
            }
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <ImageIcon width={28} height={28} stroke="#000000" />
            <View style={styles.mediaContent}>
              <Text style={styles.mediaLabel}>Add Reference Image</Text>
              <Text style={styles.mediaDesc}>Upload an image to help clarify the question</Text>
            </View>
            {questionData.imageUrl && <Text style={styles.mediaCheck}>✓</Text>}
          </Pressable>

          {/* Audio Upload */}
          <Pressable 
            style={styles.mediaBtn}
            onPress={() =>
              showAlert({
                variant: 'info',
                title: 'Audio Upload',
                message: 'Audio upload functionality coming soon.',
              })
            }
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <RazerAudioIcon width={28} height={28} stroke="#000000" />
            <View style={styles.mediaContent}>
              <Text style={styles.mediaLabel}>Add Reference Audio</Text>
              <Text style={styles.mediaDesc}>Upload audio instructions or guidance</Text>
            </View>
            {questionData.audioUrl && <Text style={styles.mediaCheck}>✓</Text>}
      </Pressable>
    </View>

        {/* Save Button */}
        <Pressable 
          style={styles.saveBtn}
          onPress={handleSave}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <Text style={styles.saveBtnText}>Save Question</Text>
        </Pressable>
      </PulseScrollView>

      {/* Question Type Modal */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTypeModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Question Type</Text>
                <PulseScrollView 
                  style={styles.typeList}
                  showsVerticalScrollIndicator={true}
                >
                  {QUESTION_TYPES.map((type) => (
                    <Pressable
                      key={type.id}
                      style={[
                        styles.typeOption,
                        questionData.type === type.id && styles.typeOptionSelected
                      ]}
                      onPress={() => {
                        setQuestionData(prev => {
                          // Reset options when changing from option-based types
                          const wasOptionType = ['multipleChoice', 'checkbox', 'dropdown'].includes(prev.type);
                          const isOptionType = ['multipleChoice', 'checkbox', 'dropdown'].includes(type.id);
                          
                          // Reset type-specific fields when changing question types
                          const resetFields: Partial<QuestionData> = {
                            type: type.id,
                            options: isOptionType && !wasOptionType ? [] : prev.options,
                            correctAnswers: isOptionType && !wasOptionType ? [] : prev.correctAnswers,
                          };
                          
                          // Reset correct answers if switching between option types
                          if (wasOptionType && isOptionType) {
                            resetFields.correctAnswers = [];
                          }
                          
                          // Reset rating-specific fields if switching away from rating
                          if (prev.type === 'rating' && type.id !== 'rating') {
                            resetFields.maxRating = 5;
                          }
                          
                          // Reset number-specific fields if switching away from number
                          if (prev.type === 'number' && type.id !== 'number') {
                            resetFields.min = undefined;
                            resetFields.max = undefined;
                            resetFields.step = undefined;
                          }
                          
                          // Reset date-specific fields if switching away from date
                          if (prev.type === 'date' && type.id !== 'date') {
                            resetFields.dateFormat = 'MM/DD/YYYY';
                            resetFields.minDate = undefined;
                            resetFields.maxDate = undefined;
                          }
                          
                          // Initialize rating maxRating if switching to rating
                          if (type.id === 'rating' && prev.type !== 'rating') {
                            resetFields.maxRating = prev.maxRating || 5;
                          }
                          
                          // Initialize date format if switching to date
                          if (type.id === 'date' && prev.type !== 'date') {
                            resetFields.dateFormat = prev.dateFormat || 'MM/DD/YYYY';
                          }
                          
                          return {
                            ...prev,
                            ...resetFields,
                          };
                        });
                        setShowTypeModal(false);
                      }}
                      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    >
                      <View style={styles.typeOptionIcon}>
                        {renderQuestionTypeIcon(type.id, 24)}
                      </View>
                      <Text style={[
                        styles.typeOptionLabel,
                        questionData.type === type.id && styles.typeOptionLabelSelected
                      ]}>
                        {type.label}
                      </Text>
                      {questionData.type === type.id && (
                        <Text style={styles.typeOptionCheck}>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </PulseScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Animated.View>
  );
};

export default QuestionsScreen;
