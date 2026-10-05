import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import OnboardingCard from './../components/OnboardingCard';
import { Image } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding02'>;

const Onboarding2Illustration = ({ width, height }: { width: number; height: number }) => (
  <Image 
    source={require('../../assets/images/onboarding-02.png')} 
    style={{ width, height }} 
    resizeMode="contain"
  />
);

const Onboarding02: React.FC<Props> = ({ navigation }) => {
  return (
    <OnboardingCard
      Illustration={Onboarding2Illustration}
      title="Plan and assign in one place"
      description="Create classes, build tasks and quizzes, and keep everything tied to the right group—without spreadsheets or a pile of separate apps."
      step={2}
      total={3}
      onNext={() => navigation.navigate('Onboarding03')}
      onSkip={() => navigation.replace('Login')}
    />
  );
};

export default Onboarding02;
