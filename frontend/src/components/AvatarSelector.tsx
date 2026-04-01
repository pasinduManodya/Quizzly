import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { AVATAR_OPTIONS, getInitials } from '../utils/avatars';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  onSelectAvatar: (avatarId: string) => void;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  firstName,
  lastName,
  email,
  onSelectAvatar
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const initials = getInitials(firstName, lastName, email);

  if (!isOpen) return null;

  const handleSelect = () => {
    onSelectAvatar(selectedAvatar);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Choose Your Avatar</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-5 gap-4">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar.id)}
                className={`
                  relative
                  w-full aspect-square
                  bg-gradient-to-br ${avatar.gradient}
                  rounded-2xl
                  flex items-center justify-center
                  font-bold text-2xl ${avatar.textColor}
                  transition-all duration-200
                  ${selectedAvatar === avatar.id 
                    ? 'ring-4 ring-blue-500 scale-105 shadow-xl' 
                    : 'hover:scale-105 hover:shadow-lg'
                  }
                `}
              >
                {initials}
                {selectedAvatar === avatar.id && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;
