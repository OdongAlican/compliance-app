import GenericInspectionInterface from './shared/GenericInspectionInterface';
import {
  fetchVehicleSetups, createVehicleSetup, updateVehicleSetup, deleteVehicleSetup,
  reassignVehicleSupervisor, reassignVehicleSafetyOfficer,
  setVehicleFilter, setVehiclePage, clearVehicleFilters, clearVehicleActionError,
  selectVehicleSetups, selectVehicleSetupsMeta, selectVehicleLoading,
  selectVehicleError, selectVehicleActionLoading, selectVehicleActionError, selectVehicleFilters,
} from '../store/slices/vehicleSlice';
import {
  VehiclePerformService, VehicleChecklistService, VehicleChecklistItemService,
  VehicleIssueService, VehicleAttachmentService, VehicleRepairAttachmentService,
} from '../services/vehicle.service';

const config = {
  title: 'Vehicle Inspection',
  permPrefix: 'vehicle_inspections',
  performPermPrefix: 'perform_vehicle_inspections',
  setupSlice: {
    fetchAction:                 fetchVehicleSetups,
    createAction:                createVehicleSetup,
    updateAction:                updateVehicleSetup,
    deleteAction:                deleteVehicleSetup,
    reassignSupervisorAction:    reassignVehicleSupervisor,
    reassignSafetyOfficerAction: reassignVehicleSafetyOfficer,
    clearActionError:            clearVehicleActionError,
    setPageAction:               setVehiclePage,
    clearFiltersAction:          clearVehicleFilters,
    filterActions: {
      date_from:  (v) => setVehicleFilter({ key: 'date_from',  value: v }),
      date_to:    (v) => setVehicleFilter({ key: 'date_to',    value: v }),
      vehicle_id: (v) => setVehicleFilter({ key: 'vehicle_id', value: v }),
      model:      (v) => setVehicleFilter({ key: 'model',      value: v }),
    },
    selectSetups:        selectVehicleSetups,
    selectMeta:          selectVehicleSetupsMeta,
    selectLoading:       selectVehicleLoading,
    selectError:         selectVehicleError,
    selectActionLoading: selectVehicleActionLoading,
    selectActionError:   selectVehicleActionError,
    selectFilters:       selectVehicleFilters,
  },
  performService:          VehiclePerformService,
  checklistService:        VehicleChecklistService,
  checklistItemService:    VehicleChecklistItemService,
  issueService:            VehicleIssueService,
  attachmentService:       VehicleAttachmentService,
  repairAttachmentService: VehicleRepairAttachmentService,
  extraSetupFields: [
    { key: 'vehicle_id', label: 'Vehicle ID', required: true,  placeholder: 'e.g. VEH-001',       colSpan: 1 },
    { key: 'model',      label: 'Model',      required: false, placeholder: 'e.g. Toyota Hilux',   colSpan: 1 },
  ],
  extraFilterFields: [
    { key: 'vehicle_id', label: 'Vehicle ID', type: 'text' },
    { key: 'model',      label: 'Model',      type: 'text' },
  ],
};

export default function VehicleInterface() {
  return <GenericInspectionInterface config={config} />;
}
