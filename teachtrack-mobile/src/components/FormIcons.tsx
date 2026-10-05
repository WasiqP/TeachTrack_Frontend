import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useThemeMode } from '../theme';

interface FormIconProps {
  iconId: string;
  size?: number;
  color?: string;
}

const FormIcon: React.FC<FormIconProps> = ({ iconId, size = 28, color }) => {
  const { ink } = useThemeMode();
  const stroke = color ?? ink.inkSoft;
  const icons: { [key: string]: React.ReactElement } = {
    clipboard: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5C15 3.89543 14.1046 3 13 3H11C9.89543 3 9 3.89543 9 5Z" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    star: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    message: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    chart: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 3V21H21" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M7 16L10 13L14 17L21 10" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M18 16H21V13" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    target: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    trophy: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M6 9H18C18 9 20 9.5 20 13C20 16 18 17 16 17H8C6 17 4 16 4 13C4 9.5 6 9 6 9Z" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M7 9V7C7 5.89543 7.89543 5 9 5H15C16.1046 5 17 5.89543 17 7V9" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 17V21" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M8 21H16" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
  };

  return icons[iconId] || icons.clipboard;
};

export default FormIcon;

