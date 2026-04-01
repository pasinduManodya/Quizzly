export interface AvatarOption {
  id: string;
  gradient: string;
  textColor: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'avatar-1', gradient: 'from-purple-500 to-pink-500', textColor: 'text-white' },
  { id: 'avatar-2', gradient: 'from-blue-500 to-cyan-500', textColor: 'text-white' },
  { id: 'avatar-3', gradient: 'from-green-500 to-emerald-500', textColor: 'text-white' },
  { id: 'avatar-4', gradient: 'from-orange-500 to-red-500', textColor: 'text-white' },
  { id: 'avatar-5', gradient: 'from-indigo-500 to-purple-500', textColor: 'text-white' },
  { id: 'avatar-6', gradient: 'from-pink-500 to-rose-500', textColor: 'text-white' },
  { id: 'avatar-7', gradient: 'from-teal-500 to-green-500', textColor: 'text-white' },
  { id: 'avatar-8', gradient: 'from-yellow-500 to-orange-500', textColor: 'text-white' },
  { id: 'avatar-9', gradient: 'from-red-500 to-pink-500', textColor: 'text-white' },
  { id: 'avatar-10', gradient: 'from-cyan-500 to-blue-500', textColor: 'text-white' },
  { id: 'avatar-11', gradient: 'from-violet-500 to-purple-500', textColor: 'text-white' },
  { id: 'avatar-12', gradient: 'from-lime-500 to-green-500', textColor: 'text-white' },
  { id: 'avatar-13', gradient: 'from-amber-500 to-yellow-500', textColor: 'text-white' },
  { id: 'avatar-14', gradient: 'from-fuchsia-500 to-pink-500', textColor: 'text-white' },
  { id: 'avatar-15', gradient: 'from-sky-500 to-blue-500', textColor: 'text-white' },
  { id: 'avatar-16', gradient: 'from-emerald-500 to-teal-500', textColor: 'text-white' },
  { id: 'avatar-17', gradient: 'from-rose-500 to-red-500', textColor: 'text-white' },
  { id: 'avatar-18', gradient: 'from-indigo-600 to-blue-600', textColor: 'text-white' },
  { id: 'avatar-19', gradient: 'from-purple-600 to-pink-600', textColor: 'text-white' },
  { id: 'avatar-20', gradient: 'from-green-600 to-cyan-600', textColor: 'text-white' },
  { id: 'avatar-21', gradient: 'from-orange-600 to-amber-600', textColor: 'text-white' },
  { id: 'avatar-22', gradient: 'from-blue-600 to-indigo-600', textColor: 'text-white' },
  { id: 'avatar-23', gradient: 'from-pink-600 to-rose-600', textColor: 'text-white' },
  { id: 'avatar-24', gradient: 'from-teal-600 to-emerald-600', textColor: 'text-white' },
  { id: 'avatar-25', gradient: 'from-slate-700 to-gray-700', textColor: 'text-white' },
  { id: 'avatar-26', gradient: 'from-red-600 to-orange-600', textColor: 'text-white' },
  { id: 'avatar-27', gradient: 'from-violet-600 to-fuchsia-600', textColor: 'text-white' },
  { id: 'avatar-28', gradient: 'from-cyan-600 to-sky-600', textColor: 'text-white' },
  { id: 'avatar-29', gradient: 'from-lime-600 to-green-600', textColor: 'text-white' },
  { id: 'avatar-30', gradient: 'from-amber-600 to-orange-600', textColor: 'text-white' },
];

export const getAvatarById = (avatarId: string): AvatarOption => {
  return AVATAR_OPTIONS.find(avatar => avatar.id === avatarId) || AVATAR_OPTIONS[0];
};

export const getInitials = (firstName?: string, lastName?: string, email?: string): string => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return 'U';
};
