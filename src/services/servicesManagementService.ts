
import { serviceRequestsService } from './serviceRequestsService';
import { proposalsService } from './proposalsService';
import { projectsService } from './projectsService';
import { professionalsService } from './professionalsService';

// Export all services as a combined object for backward compatibility
export const servicesService = {
  ...serviceRequestsService,
  ...proposalsService,
  ...projectsService,
  ...professionalsService,
};
