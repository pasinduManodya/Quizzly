const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -tokenUsage -tokenLimits');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      profile: {
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio,
        dateOfBirth: user.dateOfBirth,
        university: user.university,
        school: user.school,
        country: user.country,
        state: user.state,
        phone: user.phone,
        subscriptionType: user.subscriptionType,
        isGuest: user.isGuest,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch profile' 
    });
  }
});

router.put('/', auth, async (req, res) => {
  try {
    const { 
      username, 
      firstName, 
      lastName, 
      bio, 
      dateOfBirth, 
      university, 
      school, 
      country, 
      state, 
      phone 
    } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    if (user.isGuest) {
      return res.status(403).json({ 
        success: false, 
        error: 'Guest users cannot update profile' 
      });
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username already taken' 
        });
      }
      user.username = username;
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (university !== undefined) user.university = university;
    if (school !== undefined) user.school = school;
    if (country !== undefined) user.country = country;
    if (state !== undefined) user.state = state;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio,
        dateOfBirth: user.dateOfBirth,
        university: user.university,
        school: user.school,
        country: user.country,
        state: user.state,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update profile' 
    });
  }
});

router.put('/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ 
        success: false, 
        error: 'Avatar is required' 
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    user.avatar = avatar;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update avatar' 
    });
  }
});

router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        users: []
      });
    }

    const searchRegex = new RegExp(query, 'i');
    
    const users = await User.find({
      isGuest: false,
      $or: [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ]
    })
    .select('username firstName lastName avatar bio university school country state')
    .limit(20);

    res.json({
      success: true,
      users: users.map(user => ({
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        avatar: user.avatar,
        bio: user.bio,
        university: user.university,
        school: user.school,
        country: user.country,
        state: user.state
      }))
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search users' 
    });
  }
});

router.get('/:identifier', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    let user;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(identifier);
    } else {
      user = await User.findOne({ username: identifier });
    }

    if (!user || user.isGuest) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      profile: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        avatar: user.avatar,
        bio: user.bio,
        dateOfBirth: user.dateOfBirth,
        university: user.university,
        school: user.school,
        country: user.country,
        state: user.state,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user profile' 
    });
  }
});

module.exports = router;
