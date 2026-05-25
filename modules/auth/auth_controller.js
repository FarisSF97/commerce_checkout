const express = require('express');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5100';

const auth = {
  login: (req, res) => {
    res.render('auth/views/login');
  },

  register: (req, res) => {
    res.render('auth/views/register');
  },

  processLogin: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const apiResponse = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password
      }, {
        withCredentials: true
      });
      
      if (apiResponse.data.status === 'success') {
        req.session.user = apiResponse.data.data;
        return res.json({ status: 'success', message: 'Login successful' });
      }
      
      return res.status(apiResponse.data.code || 400).json({
        status: 'failed',
        message: apiResponse.data.message || 'Login failed'
      });
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      return res.status(error.response?.status || 500).json({
        status: 'failed',
        message: message
      });
    }
  },

  processRegister: async (req, res) => {
    try {
      const { name, email, password, confirmPassword, whatsapp } = req.body;
      
      if (password !== confirmPassword) {
        return res.status(400).json({
          status: 'failed',
          message: 'Passwords do not match'
        });
      }
      
      const apiResponse = await axios.post(`${API_BASE_URL}/register`, {
        name,
        email,
        password,
        confirmPassword,
        whatsapp
      }, {
        withCredentials: true
      });
      
      if (apiResponse.data.status === 'success') {
        req.session.user = apiResponse.data.data;
        return res.json({ status: 'success', message: 'Registration successful' });
      }
      
      return res.status(apiResponse.data.code || 400).json({
        status: 'failed',
        message: apiResponse.data.message || 'Registration failed'
      });
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed';
      return res.status(error.response?.status || 500).json({
        status: 'failed',
        message: message
      });
    }
  },

  account: (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    res.render('auth/views/account', { user: req.session.user });
  },

  changePassword: async (req, res) => {
    try {
      const { password } = req.body;
      const user = req.session.user;
      
      if (!user || !user.email) {
        return res.status(401).json({
          status: 'failed',
          message: 'Silakan login terlebih dahulu'
        });
      }
      
      if (!password || password.length < 4) {
        return res.status(400).json({
          status: 'failed',
          message: 'Password minimal 4 karakter'
        });
      }
      
      // Call backend API to update password
      const apiResponse = await axios.post(`${API_BASE_URL}/change_password`, {
        email: user.email,
        password: password
      }, {
        withCredentials: true
      });
      
      if (apiResponse.data.status === 'success') {
        return res.json({
          status: 'success',
          message: 'Password berhasil diubah'
        });
      }
      
      return res.status(apiResponse.data.code || 400).json({
        status: 'failed',
        message: apiResponse.data.message || 'Gagal ubah password'
      });
      
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({
        status: 'failed',
        message: 'Terjadi kesalahan. Silakan coba lagi.'
      });
    }
  },

  activate: async (req, res) => {
    const { token } = req.params;

    if (!token) {
      return res.render('auth/views/activate', { status: 'failed', message: 'Token tidak valid' });
    }

    try {
      const apiResponse = await axios.get(`${API_BASE_URL}/activate/${encodeURIComponent(token)}`, {
        withCredentials: true
      });

      if (apiResponse.data.status === 'success') {
        return res.render('auth/views/activate', {
          status: 'success',
          message: 'Akun Anda berhasil diaktifkan! Silakan login.'
        });
      }

      return res.render('auth/views/activate', {
        status: 'failed',
        message: apiResponse.data.message || 'Gagal mengaktifkan akun'
      });
    } catch (error) {
      console.error('Activation error:', error);
      const message = error.response?.data?.message || 'Gagal mengaktifkan akun. Silakan coba lagi.';
      return res.render('auth/views/activate', {
        status: 'failed',
        message: message
      });
    }
  },

  forgotPassword: (req, res) => {
    res.render('auth/views/forgot_password');
  },

  processForgotPassword: async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'failed', message: 'Email diperlukan' });
    }

    try {
      const apiResponse = await axios.post(`${API_BASE_URL}/forgot_password`, { email }, {
        withCredentials: true
      });

      return res.json(apiResponse.data);
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(error.response?.status || 500).json({
        status: 'failed',
        message: error.response?.data?.message || 'Gagal memproses'
      });
    }
  },

  resetPassword: async (req, res) => {
    const { token } = req.params;
    res.render('auth/views/reset_password', { token });
  },

  processResetPassword: async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ status: 'failed', message: 'Token dan password diperlukan' });
    }

    if (password.length < 4) {
      return res.status(400).json({ status: 'failed', message: 'Password minimal 4 karakter' });
    }

    try {
      const apiResponse = await axios.post(`${API_BASE_URL}/reset_password`, { token, password }, {
        withCredentials: true
      });

      return res.json(apiResponse.data);
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(error.response?.status || 500).json({
        status: 'failed',
        message: error.response?.data?.message || 'Gagal mereset password'
      });
    }
  },

  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect('/');
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  }
};

module.exports = auth;
