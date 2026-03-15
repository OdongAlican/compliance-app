import * as yup from 'yup';

export const inspectionCreateSchema = yup.object({
  inspectorName: yup.string().required('Inspector name is required'),
  date:          yup.string().required('Date is required'),
  location:      yup.string().required('Location is required'),
  supervisor:    yup.string().required('Supervisor name is required'),
});

export const issueRowSchema = yup.object({
  issue:     yup.string().required('Issue description is required'),
  action:    yup.string().required('Corrective action is required'),
  person:    yup.string().required('Responsible person is required'),
  dueDate:   yup.string().required('Due date is required'),
  priority:  yup.string().oneOf(['Low', 'Medium', 'High', 'Urgent']).required(),
});
