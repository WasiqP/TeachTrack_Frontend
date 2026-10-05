import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import OnboardingCard from './../components/OnboardingCard';
import { Image } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding01'>;

const Onboarding1Illustration = ({ width, height }: { width: number; height: number }) => (
  <Image 
    source={require('../../assets/images/onboarding-01.png')} 
    style={{ width, height }} 
    resizeMode="contain"
  />
);

const Onboarding01: React.FC<Props> = ({ navigation }) => {
  return (
    <OnboardingCard
      Illustration={Onboarding1Illustration}
      title="Welcome to TeachTrack"
      description="Your assistant for lesson planning, quizzes, and attendance—so you spend less time on admin and more with students."
      step={1}
      total={3}
      onNext={() => navigation.navigate('Onboarding02')}
      onSkip={() => navigation.replace('Login')}
    />
  );
};

export default Onboarding01;
