export type UserProfile = {
  displayName: string;
  avatarUri: string | null;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  institutionName: string;
  professionalTitle: string;
  subjectsTeach: string;
};

export function emptyProfile(): UserProfile {
  return {
    displayName: '',
    avatarUri: null,
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    institutionName: '',
    professionalTitle: '',
    subjectsTeach: '',
  };
}
