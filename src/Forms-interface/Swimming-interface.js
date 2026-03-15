import React from 'react';
import GenericInspectionInterface from './shared/GenericInspectionInterface';
import {
  fetchSwimmingPoolSetups, createSwimmingPoolSetup, updateSwimmingPoolSetup, deleteSwimmingPoolSetup,
  reassignSwimmingPoolSupervisor, reassignSwimmingPoolSafetyOfficer,
  setSwimmingPoolFilter, setSwimmingPoolPage, clearSwimmingPoolFilters, clearSwimmingPoolActionError,
  selectSwimmingPoolSetups, selectSwimmingPoolSetupsMeta, selectSwimmingPoolLoading,
  selectSwimmingPoolError, selectSwimmingPoolActionLoading, selectSwimmingPoolActionError,
  selectSwimmingPoolFilters,
} from '../store/slices/swimmingPoolSlice';
import {
  SwimmingPoolPerformService, SwimmingPoolChecklistService, SwimmingPoolChecklistItemService,
  SwimmingPoolIssueService, SwimmingPoolAttachmentService, SwimmingPoolRepairAttachmentService,
} from '../services/swimmingPool.service';

const POOL_TYPES = [
  { value: 'indoor',      label: 'Indoor'      },
  { value: 'outdoor',     label: 'Outdoor'     },
  { value: 'competition', label: 'Competition' },
  { value: 'training',    label: 'Training'    },
];

const config = {
  title: 'Swimming Pool Inspection',
  permPrefix: 'swimming_pool_inspections',
  performPermPrefix: 'perform_swimming_pool_inspections',
  setupSlice: {
    fetchAction:                 fetchSwimmingPoolSetups,
    createAction:                createSwimmingPoolSetup,
    updateAction:                updateSwimmingPoolSetup,
    deleteAction:                deleteSwimmingPoolSetup,
    reassignSupervisorAction:    reassignSwimmingPoolSupervisor,
    reassignSafetyOfficerAction: reassignSwimmingPoolSafetyOfficer,
    clearActionError:            clearSwimmingPoolActionError,
    setPageAction:               setSwimmingPoolPage,
    clearFiltersAction:          clearSwimmingPoolFilters,
    filterActions: {
      date_from:     (v) => setSwimmingPoolFilter({ date_from: v }),
      date_to:       (v) => setSwimmingPoolFilter({ date_to: v }),
      pool_type:     (v) => setSwimmingPoolFilter({ pool_type: v }),
      pool_location: (v) => setSwimmingPoolFilter({ pool_location: v }),
    },
    selectSetups:        selectSwimmingPoolSetups,
    selectMeta:          selectSwimmingPoolSetupsMeta,
    selectLoading:       selectSwimmingPoolLoading,
    selectError:         selectSwimmingPoolError,
    selectActionLoading: selectSwimmingPoolActionLoading,
    selectActionError:   selectSwimmingPoolActionError,
    selectFilters:       selectSwimmingPoolFilters,
  },
  performService:          SwimmingPoolPerformService,
  checklistService:        SwimmingPoolChecklistService,
  checklistItemService:    SwimmingPoolChecklistItemService,
  issueService:            SwimmingPoolIssueService,
  attachmentService:       SwimmingPoolAttachmentService,
  repairAttachmentService: SwimmingPoolRepairAttachmentService,
  extraSetupFields: [
    { key: 'pool_type',     label: 'Pool Type',     required: false, type: 'select', colSpan: 1, options: POOL_TYPES },
    { key: 'pool_location', label: 'Pool Location', required: false, placeholder: 'e.g. North Wing', colSpan: 1 },
  ],
  extraFilterFields: [
    { key: 'pool_type',     label: 'Pool Type',     type: 'text' },
    { key: 'pool_location', label: 'Pool Location', type: 'text' },
  ],
};

export default function SwimmingPoolInterface() {
  return <GenericInspectionInterface config={config} />;
}
