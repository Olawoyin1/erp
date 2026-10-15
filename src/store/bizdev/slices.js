import { createProcSlice } from '../procurement/createProcSlice';
import {
  clientService,
  interactionService,
  opportunityService,
  tenderService,
  rfqService,
} from '../../services/bizdev.service';

export const clientsSlice = createProcSlice('bizClients', clientService);
export const interactionsSlice = createProcSlice('bizInteractions', interactionService);
export const opportunitiesSlice = createProcSlice('bizOpportunities', opportunityService);
export const tendersSlice = createProcSlice('bizTenders', tenderService);
export const rfqsSlice = createProcSlice('bizRfqs', rfqService);
