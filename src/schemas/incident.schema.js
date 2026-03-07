import * as yup from 'yup';

export const incidentReportSchema = yup.object({
  title:          yup.string().required('Incident title is required'),
  date:           yup.string().required('Date is required'),
  time:           yup.string().required('Time is required'),
  location:       yup.string().required('Location is required'),
  description:    yup.string().min(20, 'Provide at least 20 characters').required(),
  severity:       yup.string().oneOf(['Low', 'Medium', 'High', 'Critical']).required(),
  reportedBy:     yup.string().required('Reporter name is required'),
});

export const witnessStatementSchema = yup.object({
  witnessName:  yup.string().required('Witness name is required'),
  statement:    yup.string().min(10, 'Provide at least 10 characters').required(),
  date:         yup.string().required('Date is required'),
  contactInfo:  yup.string(),
});

export const investigationSchema = yup.object({
  rootCause:        yup.string().required('Root cause is required'),
  contributingFactors: yup.string(),
  correctiveActions:yup.string().required('Corrective actions are required'),
  preventativeMeasures: yup.string(),
  closedBy:         yup.string().required('Closed-by name is required'),
  closedDate:       yup.string().required('Closure date is required'),
});
