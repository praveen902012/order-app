import crypto from 'crypto';

export const generateId = () => {
  return crypto.randomBytes(16).toString('hex');
};

export const generateUniqueCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};
