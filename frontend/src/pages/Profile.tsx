import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, MapPin, GraduationCap, School, Calendar, Mail } from 'lucide-react';
import Avatar from '../components/Avatar';
import AvatarSelector from '../components/AvatarSelector';
import { profileAPI } from '../services/profileAPI';
import '../styles/profile-animations.css';

interface ProfileData {
  _id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  bio: string;
  dateOfBirth: string | null;
  university: string;
  school: string;
  country: string;
  state: string;
  phone: string;
  subscriptionType: string;
  createdAt: string;
}

const Profile: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    bio: '',
    dateOfBirth: '',
    university: '',
    school: '',
    country: '',
    state: '',
    phone: ''
  });

  const isOwnProfile = !username || username === profile?.username;

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = username 
        ? await profileAPI.getUserProfile(username)
        : await profileAPI.getProfile();

      if (data.success) {
        setProfile(data.profile);
        setFormData({
          username: data.profile.username || '',
          firstName: data.profile.firstName || '',
          lastName: data.profile.lastName || '',
          bio: data.profile.bio || '',
          dateOfBirth: data.profile.dateOfBirth ? data.profile.dateOfBirth.split('T')[0] : '',
          university: data.profile.university || '',
          school: data.profile.school || '',
          country: data.profile.country || '',
          state: data.profile.state || '',
          phone: data.profile.phone || ''
        });
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const data = await profileAPI.updateProfile(formData);

      if (data.success) {
        setProfile(data.profile);
        setIsEditing(false);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (avatarId: string) => {
    try {
      const data = await profileAPI.updateAvatar(avatarId);

      if (data.success && profile) {
        setProfile({ ...profile, avatar: data.avatar });
      }
    } catch (err) {
      console.error('Avatar update error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#ffffff', fontFamily: "'Outfit', sans-serif" }}>
      {/* Geometric background elements matching landing page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute" style={{
          width: '600px',
          height: '600px',
          top: '-200px',
          right: '-150px',
          borderRadius: '50%',
          border: '1px solid rgba(67,97,238,0.06)',
          animation: 'rotateSlow 80s linear infinite'
        }}></div>
        <div className="absolute" style={{
          width: '400px',
          height: '400px',
          top: '-100px',
          right: '-50px',
          borderRadius: '50%',
          border: '1px solid rgba(67,97,238,0.08)',
          animation: 'rotateSlow 50s linear infinite reverse'
        }}></div>
        <div className="absolute" style={{
          width: '450px',
          height: '450px',
          top: '-120px',
          right: '-100px',
          borderRadius: '50%',
          background: 'rgba(67,97,238,0.03)',
          filter: 'blur(72px)'
        }}></div>
        <div className="absolute" style={{
          width: '300px',
          height: '300px',
          bottom: '10%',
          left: '-80px',
          borderRadius: '50%',
          background: 'rgba(13,148,136,0.04)',
          filter: 'blur(72px)'
        }}></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(67,97,238,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.5
        }}></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-7 py-12">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 group flex items-center gap-2 transition-all duration-300"
          style={{ color: '#8888aa' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#12122a'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#8888aa'}
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {error && (
          <div className="mb-6 p-4 rounded-2xl text-red-700 animate-fade-in" style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        {!isEditing ? (
          <div className="space-y-6 animate-fade-in">
            {/* Profile Card */}
            <div className="overflow-hidden transition-all duration-500" style={{
              background: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 4px 12px rgba(20,20,40,0.06), 0 2px 4px rgba(20,20,40,0.04)',
              border: '1px solid rgba(20,20,40,0.08)'
            }}>
              {/* Header Section */}
              <div className="relative p-8 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar
                        avatarId={profile.avatar}
                        firstName={profile.firstName}
                        lastName={profile.lastName}
                        email={profile.email}
                        size="2xl"
                        className="ring-4 ring-white shadow-2xl transform group-hover:scale-105 transition-all duration-300"
                        onClick={isOwnProfile ? () => setIsAvatarSelectorOpen(true) : undefined}
                      />
                      {isOwnProfile && (
                        <button
                          onClick={() => setIsAvatarSelectorOpen(true)}
                          className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2.5 rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold mb-1 tracking-tight" style={{ color: '#12122a' }}>
                        {profile.firstName && profile.lastName 
                          ? `${profile.firstName} ${profile.lastName}`
                          : profile.username || 'User'}
                      </h1>
                      {profile.username && (
                        <p className="text-lg" style={{ color: '#8888aa' }}>@{profile.username}</p>
                      )}
                      {isOwnProfile && (
                        <p className="text-xs mt-2" style={{ color: '#8888aa' }}>
                          Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="group px-5 py-2.5 text-white rounded-xl transition-all duration-300 flex items-center gap-2 transform hover:scale-105"
                      style={{
                        background: '#4361ee',
                        boxShadow: '0 8px 32px rgba(67,97,238,0.22)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2f4ac9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#4361ee'}
                    >
                      <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="font-medium">Edit</span>
                    </button>
                  )}
                </div>

                {profile.bio && (
                  <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(20,20,40,0.08)' }}>
                    <p className="leading-relaxed" style={{ color: '#4a4a6a' }}>{profile.bio}</p>
                  </div>
                )}
              </div>

              {/* Info Grid */}
              <div className="px-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profile.email && (
                    <div className="group p-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-0.5" style={{
                      background: 'rgba(67,97,238,0.04)',
                      border: '1px solid rgba(67,97,238,0.08)'
                    }}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl transition-all duration-300" style={{
                          background: '#ffffff',
                          boxShadow: '0 1px 3px rgba(20,20,40,0.06)'
                        }}>
                          <Mail className="w-5 h-5" style={{ color: '#4361ee' }} />
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#8888aa' }}>Email</p>
                          <p className="font-semibold" style={{ color: '#12122a' }}>{profile.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.dateOfBirth && (
                    <div className="group p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100/50 hover:border-purple-200 transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Birthday</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(profile.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.university && (
                    <div className="group p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100/50 hover:border-emerald-200 transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                          <GraduationCap className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">University</p>
                          <p className="font-semibold text-gray-900">{profile.university}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.school && (
                    <div className="group p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100/50 hover:border-amber-200 transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                          <School className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">School</p>
                          <p className="font-semibold text-gray-900">{profile.school}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(profile.country || profile.state) && (
                    <div className="group p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-100/50 hover:border-rose-200 transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                          <MapPin className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Location</p>
                          <p className="font-semibold text-gray-900">
                            {[profile.state, profile.country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 animate-fade-in" style={{
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(20,20,40,0.06), 0 2px 4px rgba(20,20,40,0.04)',
            border: '1px solid rgba(20,20,40,0.08)'
          }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#12122a' }}>Edit Profile</h2>
            
            <div className="space-y-5">
              <div className="group">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8888aa' }}>
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300"
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(20,20,40,0.08)',
                    color: '#12122a'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = 'none';
                    e.currentTarget.style.borderColor = '#4361ee';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(20,20,40,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="Enter username"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8888aa' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl transition-all duration-300"
                    style={{ background: '#ffffff', border: '1px solid rgba(20,20,40,0.08)', color: '#12122a' }}
                    onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(20,20,40,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="First name"
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8888aa' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl transition-all duration-300"
                    style={{ background: '#ffffff', border: '1px solid rgba(20,20,40,0.08)', color: '#12122a' }}
                    onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(20,20,40,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8888aa' }}>
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl resize-none transition-all duration-300"
                  style={{ background: '#ffffff', border: '1px solid rgba(20,20,40,0.08)', color: '#12122a' }}
                  onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(20,20,40,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs mt-2" style={{ color: '#8888aa' }}>
                  {formData.bio.length}/500 characters
                </p>
              </div>

              <div className="group">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8888aa' }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300"
                  style={{ background: '#ffffff', border: '1px solid rgba(20,20,40,0.08)', color: '#12122a' }}
                  onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(20,20,40,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8888aa' }}>
                    University
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl transition-all duration-300"
                    style={{ background: '#ffffff', border: '1px solid rgba(20,20,40,0.08)', color: '#12122a' }}
                    onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(20,20,40,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Your university"
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8888aa' }}>
                    School
                  </label>
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl transition-all duration-300"
                    style={{ background: '#ffffff', border: '1px solid rgba(20,20,40,0.08)', color: '#12122a' }}
                    onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(20,20,40,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Your school"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8888aa' }}>
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl transition-all duration-300"
                    style={{ background: '#ffffff', border: '1px solid rgba(20,20,40,0.08)', color: '#12122a' }}
                    onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(20,20,40,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Your country"
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8888aa' }}>
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl transition-all duration-300"
                    style={{ background: '#ffffff', border: '1px solid rgba(20,20,40,0.08)', color: '#12122a' }}
                    onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(20,20,40,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Your state"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8888aa' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-300"
                  style={{ background: '#ffffff', border: '1px solid rgba(20,20,40,0.08)', color: '#12122a' }}
                  onFocus={(e) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.borderColor = '#4361ee'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(20,20,40,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="Your phone number"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    fetchProfile();
                  }}
                  className="px-6 py-2.5 rounded-xl transition-all duration-300 font-medium transform hover:scale-105"
                  style={{
                    border: '1px solid rgba(20,20,40,0.08)',
                    color: '#4a4a6a',
                    background: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f7f7f5';
                    e.currentTarget.style.borderColor = 'rgba(20,20,40,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = 'rgba(20,20,40,0.08)';
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 text-white rounded-xl transition-all duration-300 font-medium disabled:opacity-50 transform hover:scale-105"
                  style={{
                    background: '#4361ee',
                    boxShadow: '0 8px 32px rgba(67,97,238,0.22)'
                  }}
                  onMouseEnter={(e) => !saving && (e.currentTarget.style.background = '#2f4ac9')}
                  onMouseLeave={(e) => !saving && (e.currentTarget.style.background = '#4361ee')}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AvatarSelector
        isOpen={isAvatarSelectorOpen}
        onClose={() => setIsAvatarSelectorOpen(false)}
        currentAvatar={profile.avatar}
        firstName={profile.firstName}
        lastName={profile.lastName}
        email={profile.email}
        onSelectAvatar={handleAvatarSelect}
      />
    </div>
  );
};

export default Profile;
