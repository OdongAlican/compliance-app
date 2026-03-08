import * as yup from 'yup';

/**
 * Aligned to the Rails API /users contract.
 * Required by model: email, role_id, firstname, lastname, staff_id
 * Optional: profession_id, othername, gender, age, phone
 * Note: password is never sent — backend generates a temporary one.
 */

export const createUserSchema = yup.object({
  email:         yup.string().email('Enter a valid email').required('Email is required'),
  firstname:     yup.string().required('First name is required'),
  lastname:      yup.string().required('Last name is required'),
  othername:     yup.string().optional(),
  staff_id:      yup.string().required('Staff ID is required'),
  role_id:       yup.number().required('Role is required').typeError('Role is required'),
  profession_id: yup.number().nullable().optional(),
  gender:        yup.string().oneOf(['male', 'female', 'other', ''], 'Invalid gender').optional(),
  age:           yup.number().min(0, 'Age must be 0 or above').nullable().optional().typeError('Age must be a number'),
  phone:         yup.string().min(7, 'Phone too short').max(20, 'Phone too long').optional(),
});

export const updateUserSchema = yup.object({
  email:         yup.string().email('Enter a valid email').optional(),
  firstname:     yup.string().optional(),
  lastname:      yup.string().optional(),
  othername:     yup.string().optional(),
  staff_id:      yup.string().optional(),
  role_id:       yup.number().nullable().optional().typeError('Role must be a number'),
  profession_id: yup.number().nullable().optional(),
  gender:        yup.string().oneOf(['male', 'female', 'other', ''], 'Invalid gender').optional(),
  age:           yup.number().min(0).nullable().optional().typeError('Age must be a number'),
  phone:         yup.string().min(7, 'Phone too short').max(20, 'Phone too long').optional(),
});

