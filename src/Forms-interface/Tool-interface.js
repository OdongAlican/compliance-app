import React from 'react';
import GenericInspectionInterface from './shared/GenericInspectionInterface';
import {
  fetchToolSetups, createToolSetup, updateToolSetup, deleteToolSetup,
  reassignToolSupervisor, reassignToolSafetyOfficer,
  setToolFilter, setToolPage, clearToolFilters, clearToolActionError,
  selectToolSetups, selectToolSetupsMeta, selectToolLoading,
  selectToolError, selectToolActionLoading, selectToolActionError, selectToolFilters,
} from '../store/slices/toolSlice';
import {
  ToolPerformService, ToolChecklistService, ToolChecklistItemService,
  ToolIssueService, ToolAttachmentService, ToolRepairAttachmentService,
} from '../services/tool.service';

const config = {
  title: 'Hand & Power Tools Inspection',
  permPrefix: 'hand_power_tools_inspections',
  performPermPrefix: 'perform_hand_power_tools_inspections',
  setupSlice: {
    fetchAction:                 fetchToolSetups,
    createAction:                createToolSetup,
    updateAction:                updateToolSetup,
    deleteAction:                deleteToolSetup,
    reassignSupervisorAction:    reassignToolSupervisor,
    reassignSafetyOfficerAction: reassignToolSafetyOfficer,
    clearActionError:            clearToolActionError,
    setPageAction:               setToolPage,
    clearFiltersAction:          clearToolFilters,
    filterActions: {
      date_from: (v) => setToolFilter({ date_from: v }),
      date_to:   (v) => setToolFilter({ date_to: v }),
      tool_name: (v) => setToolFilter({ tool_name: v }),
      tool_id:   (v) => setToolFilter({ tool_id: v }),
      location:  (v) => setToolFilter({ location: v }),
    },
    selectSetups:        selectToolSetups,
    selectMeta:          selectToolSetupsMeta,
    selectLoading:       selectToolLoading,
    selectError:         selectToolError,
    selectActionLoading: selectToolActionLoading,
    selectActionError:   selectToolActionError,
    selectFilters:       selectToolFilters,
  },
  performService:          ToolPerformService,
  checklistService:        ToolChecklistService,
  checklistItemService:    ToolChecklistItemService,
  issueService:            ToolIssueService,
  attachmentService:       ToolAttachmentService,
  repairAttachmentService: ToolRepairAttachmentService,
  extraSetupFields: [
    { key: 'tool_name', label: 'Tool Name', required: true,  placeholder: 'e.g. Angle Grinder', colSpan: 1 },
    { key: 'tool_id',   label: 'Tool ID',   required: false, placeholder: 'e.g. TOOL-001',      colSpan: 1 },
  ],
  extraFilterFields: [
    { key: 'tool_name', label: 'Tool Name', type: 'text' },
    { key: 'tool_id',   label: 'Tool ID',   type: 'text' },
    { key: 'location',  label: 'Location',  type: 'text' },
  ],
};

export default function ToolInterface() {
  return <GenericInspectionInterface config={config} />;
}
