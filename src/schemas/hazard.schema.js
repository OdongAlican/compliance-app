import * as yup from 'yup';

export const hazardReportSchema = yup.object({
  title:       yup.string().required('Hazard title is required'),
  location:    yup.string().required('Location is required'),
  date:        yup.string().required('Date is required'),
  description: yup.string().min(10, 'Provide at least 10 characters').required(),
  likelihood:  yup.number().min(1).max(5).required('Likelihood rating is required'),
  severity:    yup.number().min(1).max(5).required('Severity rating is required'),
  reportedBy:  yup.string().required('Reporter name is required'),
});

export const riskAssessmentSchema = yup.object({
  hazardId:         yup.string().required('Select a related hazard'),
  controlMeasures:  yup.string().required('Control measures are required'),
  residualRisk:     yup.number().min(1).max(25).required(),
  reviewDate:       yup.string().required('Review date is required'),
  assessedBy:       yup.string().required('Assessor name is required'),
});
