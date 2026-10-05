import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { fonts as F, radius, useThemeMode } from '../theme';
import BackButton from '../components/Reusable-Components/BackButton';
import { PulseScrollView } from '../components/PulseScrollView';
import { usePulseAlert } from '../context/AlertModalContext';
import Svg, { Path } from 'react-native-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonPlanner'>;

// AI Icon
const AIIcon = ({ size = 24, color = '#A060FF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M2 17L12 22L22 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M2 12L12 17L22 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const LessonPlanner: React.FC<Props> = ({ navigation }) => {
  const { ink, theme } = useThemeMode();
  const { showAlert, showSuccess } = usePulseAlert();
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [duration, setDuration] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const gradeLevels = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
                       'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  const handleGenerate = async () => {
    if (!subject || !topic || !gradeLevel || !duration) {
      showAlert({
        variant: 'warning',
        title: 'Missing Information',
        message: 'Please fill in all required fields',
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation (replace with actual API call later)
    setTimeout(() => {
      setIsGenerating(false);
      showSuccess(
        'Lesson Plan Generated!',
        'Your AI-generated lesson plan is ready. This feature will be fully functional once we integrate the AI API.',
      );
    }, 2000);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: ink.canvas,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        backBtn: {
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: {
          fontSize: 20,
          fontWeight: '700',
          fontFamily: F.outfitBold,
          color: ink.ink,
        },
        placeholder: {
          width: 40,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          paddingBottom: 60,
        },
        aiHeader: {
          alignItems: 'center',
          paddingTop: 32,
          paddingBottom: 24,
          paddingHorizontal: 24,
        },
        aiIconContainer: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        },
        aiTitle: {
          fontSize: 24,
          fontWeight: '700',
          fontFamily: F.outfitBold,
          color: ink.ink,
          marginBottom: 8,
        },
        aiSubtitle: {
          fontSize: 14,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          textAlign: 'center',
          lineHeight: 20,
        },
        form: {
          paddingHorizontal: 24,
          paddingTop: 8,
        },
        inputGroup: {
          marginBottom: 20,
        },
        label: {
          fontSize: 16,
          fontWeight: '600',
          fontFamily: F.dmSemi,
          color: ink.ink,
          marginBottom: 8,
        },
        input: {
          backgroundColor: theme.backgroundAlt,
          borderWidth: 1,
          borderColor: ink.borderInk,
          borderRadius: radius.input,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
          fontFamily: F.dmRegular,
          color: ink.ink,
        },
        textArea: {
          height: 100,
          textAlignVertical: 'top',
          paddingTop: 14,
        },
        gradeScroll: {
          marginTop: 8,
        },
        gradeChip: {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 20,
          backgroundColor: theme.backgroundAlt,
          borderWidth: 1,
          borderColor: theme.border,
          marginRight: 8,
        },
        gradeChipActive: {
          backgroundColor: theme.primary,
          borderColor: theme.primary,
        },
        gradeChipText: {
          fontSize: 14,
          fontFamily: F.dmMedium,
          color: ink.inkSoft,
        },
        gradeChipTextActive: {
          color: theme.white,
        },
        generateBtn: {
          backgroundColor: theme.primary,
          borderRadius: radius.card,
          paddingVertical: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 8,
          marginBottom: 24,
          shadowColor: theme.primary,
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
          elevation: 4,
        },
        generateBtnDisabled: {
          opacity: 0.6,
        },
        generateBtnContent: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        loadingContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        generateBtnText: {
          fontSize: 18,
          fontWeight: '600',
          fontFamily: F.dmSemi,
          color: theme.white,
        },
        infoBox: {
          backgroundColor: theme.primarySoft,
          borderWidth: 1,
          borderColor: theme.primary,
          borderRadius: radius.input,
          padding: 16,
        },
        infoTitle: {
          fontSize: 16,
          fontWeight: '600',
          fontFamily: F.dmSemi,
          color: ink.ink,
          marginBottom: 8,
        },
        infoText: {
          fontSize: 14,
          fontFamily: F.dmRegular,
          color: ink.inkSoft,
          marginBottom: 4,
          lineHeight: 20,
        },
      }),
    [ink, theme],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          stroke={ink.ink}
          rippleColor="rgba(0,0,0,0.06)"
        />
        <Text style={styles.headerTitle}>AI Lesson Planner</Text>
        <View style={styles.placeholder} />
      </View>

      <PulseScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Icon Header */}
        <View style={styles.aiHeader}>
          <View style={styles.aiIconContainer}>
            <AIIcon size={48} color={theme.primary} />
          </View>
          <Text style={styles.aiTitle}>Generate Your Lesson Plan</Text>
          <Text style={styles.aiSubtitle}>
            Fill in the details below and let AI create a complete lesson plan for you
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Subject */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mathematics, English, Science"
              placeholderTextColor={ink.placeholder}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {/* Topic */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Topic *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Quadratic Equations, Shakespeare, Photosynthesis"
              placeholderTextColor={ink.placeholder}
              value={topic}
              onChangeText={setTopic}
            />
          </View>

          {/* Grade Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Grade Level *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeScroll}>
              {gradeLevels.map((grade) => (
                <Pressable
                  key={grade}
                  style={[
                    styles.gradeChip,
                    gradeLevel === grade && styles.gradeChipActive,
                  ]}
                  onPress={() => setGradeLevel(grade)}
                  android_ripple={{ color: 'rgba(160,96,255,0.1)' }}
                >
                  <Text
                    style={[
                      styles.gradeChipText,
                      gradeLevel === grade && styles.gradeChipTextActive,
                    ]}
                  >
                    {grade}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 45 minutes, 1 hour, 90 minutes"
              placeholderTextColor={ink.placeholder}
              value={duration}
              onChangeText={setDuration}
            />
          </View>

          {/* Learning Objectives (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Learning Objectives (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What should students learn? (e.g., Understand the concept of...)"
              placeholderTextColor={ink.placeholder}
              value={learningObjectives}
              onChangeText={setLearningObjectives}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Generate Button */}
          <Pressable
            style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={isGenerating}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            {isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={theme.white} size="small" />
                <Text style={styles.generateBtnText}>Generating...</Text>
              </View>
            ) : (
              <View style={styles.generateBtnContent}>
                <AIIcon size={24} color={theme.white} />
                <Text style={styles.generateBtnText}>Generate Lesson Plan</Text>
              </View>
            )}
          </Pressable>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 What you'll get:</Text>
            <Text style={styles.infoText}>• Complete lesson objectives</Text>
            <Text style={styles.infoText}>• Step-by-step activities</Text>
            <Text style={styles.infoText}>• Required materials list</Text>
            <Text style={styles.infoText}>• Task suggestions</Text>
            <Text style={styles.infoText}>• Differentiation strategies</Text>
          </View>
        </View>
      </PulseScrollView>
    </SafeAreaView>
  );
};

export default LessonPlanner;

