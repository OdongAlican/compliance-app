import * as yup from 'yup';

export const capaSchema = yup.object({
    title: yup.string().required('CAPA title is required'),
    rootCause: yup.string().required('Root cause is required'),
    correctiveAction: yup.string().required('Corrective action is required'),
    preventiveAction: yup.string(),
    assignedTo: yup.string().required('Assign to a person'),
    dueDate: yup.string().required('Due date is required'),
    priority: yup.string().oneOf(['Low', 'Medium', 'High', 'Urgent']).required(),
});

export const checklistSchema = yup.object({
    title: yup.string().required('Checklist title is required'),
    category: yup.string().required('Category is required'),
    dueDate: yup.string().required('Due date is required'),
    assignedTo: yup.string().required('Assign to a person'),
});
