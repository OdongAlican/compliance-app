import React from 'react';
import GenericInspectionInterface from './shared/GenericInspectionInterface';
import {
  fetchPpeSetups, createPpeSetup, updatePpeSetup, deletePpeSetup,
  reassignPpeSupervisor, reassignPpeSafetyOfficer,
  setPpeFilter, setPpePage, clearPpeFilters, clearPpeActionError,
  selectPpeSetups, selectPpeSetupsMeta, selectPpeLoading,
  selectPpeError, selectPpeActionLoading, selectPpeActionError, selectPpeFilters,
} from '../store/slices/ppeSlice';
import {
  PpePerformService, PpeChecklistService, PpeChecklistItemService,
  PpeIssueService, PpeAttachmentService, PpeRepairAttachmentService,
} from '../services/ppe.service';

const config = {
  title: 'PPE Inspection',
  permPrefix: 'ppe_inspections',
  performPermPrefix: 'perform_ppe_inspections',
  setupSlice: {
    fetchAction:                 fetchPpeSetups,
    createAction:                createPpeSetup,
    updateAction:                updatePpeSetup,
    deleteAction:                deletePpeSetup,
    reassignSupervisorAction:    reassignPpeSupervisor,
    reassignSafetyOfficerAction: reassignPpeSafetyOfficer,
    clearActionError:            clearPpeActionError,
    setPageAction:               setPpePage,
    clearFiltersAction:          clearPpeFilters,
    filterActions: {
      date_from:   (v) => setPpeFilter({ key: 'date_from',   value: v }),
      date_to:     (v) => setPpeFilter({ key: 'date_to',     value: v }),
      department:  (v) => setPpeFilter({ key: 'department',  value: v }),
      ppe_user_id: (v) => setPpeFilter({ key: 'ppe_user_id', value: v }),
    },
    selectSetups:        selectPpeSetups,
    selectMeta:          selectPpeSetupsMeta,
    selectLoading:       selectPpeLoading,
    selectError:         selectPpeError,
    selectActionLoading: selectPpeActionLoading,
    selectActionError:   selectPpeActionError,
    selectFilters:       selectPpeFilters,
  },
  performService:          PpePerformService,
  checklistService:        PpeChecklistService,
  checklistItemService:    PpeChecklistItemService,
  issueService:            PpeIssueService,
  attachmentService:       PpeAttachmentService,
  repairAttachmentService: PpeRepairAttachmentService,
  extraSetupFields: [
    { key: 'department', label: 'Department', required: false, placeholder: 'e.g. Maintenance', colSpan: 1 },
  ],
  extraFilterFields: [
    { key: 'department', label: 'Department', type: 'text' },
  ],
};

export default function PPEInterface() {
  return <GenericInspectionInterface config={config} />;
}
