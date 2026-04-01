import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User as UserIcon } from 'lucide-react';
import Avatar from '../components/Avatar';
import { profileAPI } from '../services/profileAPI';

interface SearchResult {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string;
  bio: string;
  university: string;
  school: string;
  country: string;
  state: string;
}

const ProfileSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      const data = await profileAPI.searchUsers(query);

      if (data.success) {
        setSearchResults(data.users);
        setHasSearched(true);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username: string) => {
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find People</h1>
          <p className="text-gray-600">Search for users by name or username</p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for users..."
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        )}

        {!loading && hasSearched && searchResults.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No users found</p>
            <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
          </div>
        )}

        {!loading && searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((user) => (
              <div
                key={user._id}
                onClick={() => handleUserClick(user.username)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer p-6 border border-gray-100 hover:border-blue-300"
              >
                <div className="flex items-start gap-4">
                  <Avatar
                    avatarId={user.avatar}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {user.fullName}
                    </h3>
                    {user.username && (
                      <p className="text-sm text-gray-600">@{user.username}</p>
                    )}
                    {user.bio && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {user.university && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          {user.university}
                        </span>
                      )}
                      {user.school && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                          {user.school}
                        </span>
                      )}
                      {(user.state || user.country) && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                          {[user.state, user.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSearch;
