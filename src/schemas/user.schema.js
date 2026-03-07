import * as yup from 'yup';

export const createUserSchema = yup.object({
  firstName:  yup.string().required('First name is required'),
  lastName:   yup.string().required('Last name is required'),
  email:      yup.string().email('Enter a valid email').required('Email is required'),
  role:       yup.string().required('Select a role'),
  department: yup.string(),
  phone:      yup.string(),
});

export const updateUserSchema = yup.object({
  firstName:  yup.string().required('First name is required'),
  lastName:   yup.string().required('Last name is required'),
  email:      yup.string().email('Enter a valid email').required('Email is required'),
  role:       yup.string().required('Select a role'),
  department: yup.string(),
  phone:      yup.string(),
  isActive:   yup.boolean(),
});
