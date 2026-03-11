import React from 'react';
import GenericInspectionInterface from './shared/GenericInspectionInterface';
import {
  fetchScienceLabSetups, createScienceLabSetup, updateScienceLabSetup, deleteScienceLabSetup,
  reassignScienceLabSupervisor, reassignScienceLabSafetyOfficer,
  setScienceLabPage, setScienceLabLabName, setScienceLabDateFrom, setScienceLabDateTo,
  clearScienceLabFilters, clearScienceLabActionError,
  selectScienceLabSetups, selectScienceLabMeta, selectScienceLabLoading,
  selectScienceLabError, selectScienceLabActionLoading, selectScienceLabActionError,
  selectScienceLabFilters,
} from '../store/slices/scienceLabSlice';
import {
  ScienceLabPerformService, ScienceLabChecklistService, ScienceLabChecklistItemService,
  ScienceLabIssueService, ScienceLabAttachmentService, ScienceLabRepairAttachmentService,
} from '../services/scienceLab.service';

const config = {
  title: 'Science Lab Inspection',
  permPrefix: 'science_lab_inspections',
  performPermPrefix: 'perform_science_lab_inspections',
  setupSlice: {
    fetchAction:                 fetchScienceLabSetups,
    createAction:                createScienceLabSetup,
    updateAction:                updateScienceLabSetup,
    deleteAction:                deleteScienceLabSetup,
    reassignSupervisorAction:    reassignScienceLabSupervisor,
    reassignSafetyOfficerAction: reassignScienceLabSafetyOfficer,
    clearActionError:            clearScienceLabActionError,
    setPageAction:               setScienceLabPage,
    clearFiltersAction:          clearScienceLabFilters,
    filterActions: {
      date_from:       setScienceLabDateFrom,
      date_to:         setScienceLabDateTo,
      laboratory_name: setScienceLabLabName,
    },
    selectSetups:        selectScienceLabSetups,
    selectMeta:          selectScienceLabMeta,
    selectLoading:       selectScienceLabLoading,
    selectError:         selectScienceLabError,
    selectActionLoading: selectScienceLabActionLoading,
    selectActionError:   selectScienceLabActionError,
    selectFilters:       selectScienceLabFilters,
  },
  performService:          ScienceLabPerformService,
  checklistService:        ScienceLabChecklistService,
  checklistItemService:    ScienceLabChecklistItemService,
  issueService:            ScienceLabIssueService,
  attachmentService:       ScienceLabAttachmentService,
  repairAttachmentService: ScienceLabRepairAttachmentService,
  extraSetupFields: [
    { key: 'laboratory_name', label: 'Laboratory Name', required: true, placeholder: 'e.g. Biology Lab A', colSpan: 2 },
  ],
  extraFilterFields: [
    { key: 'laboratory_name', label: 'Laboratory Name', type: 'text' },
  ],
};

export default function ScienceLabInterface() {
  return <GenericInspectionInterface config={config} />;
}
