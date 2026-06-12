const express = require('express');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5100';

const auth = {
  login: (req, res) => {
    if (req.session.user) return res.redirect('/account');
    res.render('auth/views/login');
  },

  register: (req, res) => {
    if (req.session.user) return res.redirect('/account');
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
          message: 'Password tidak sama!'
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
        return res.json({ status: 'success', message: 'Registrasi berhasil! Silakan cek email untuk aktivasi akun.' });
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

  account: async (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }

    const user = req.session.user;

    const memberBaseUrl = process.env.MEMBER_BASE_URL || 'http://localhost:4500';
    res.render('auth/views/account', { user, memberBaseUrl });
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
          message: 'Akun Anda sudah aktif! Silakan login kembali.'
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
