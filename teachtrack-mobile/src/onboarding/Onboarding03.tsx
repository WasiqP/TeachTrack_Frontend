import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import OnboardingCard from './../components/OnboardingCard';
import { Image } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding03'>;

const Onboarding3Illustration = ({ width, height }: { width: number; height: number }) => (
  <Image 
    source={require('../../assets/images/onboarding-03.png')} 
    style={{ width, height }} 
    resizeMode="contain"
  />
);

const Onboarding03: React.FC<Props> = ({ navigation }) => {
  return (
    <OnboardingCard
      Illustration={Onboarding3Illustration}
      title="Track what matters"
      description="Mark attendance, follow class activity, and keep your teaching week organized—from one clear dashboard on your phone."
      step={3}
      total={3}
      onNext={() => navigation.replace('SignUp')}
      nextLabel="Get Started"
    />
  );
};

export default Onboarding03;
