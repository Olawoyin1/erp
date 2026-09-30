import React from 'react';
import { GenericHRPage } from '../hr/PlaceholderPage';

export const EngineeringDocsPage = () => (
  <GenericHRPage title="Engineering Documents" category="Technical" description="Manage engineering and technical documents" />
);

export const CalibrationRecordsPage = () => (
  <GenericHRPage title="Calibration Records" category="Technical" description="Track equipment calibration schedules" />
);

export const ResourceAllocationPage = () => (
  <GenericHRPage title="Resource Allocation" category="Technical" description="Allocate personnel and equipment to projects" />
);

export const TechnicalTasksPage = () => (
  <GenericHRPage title="Tasks" category="Technical" description="Manage technical and engineering tasks" />
);

export const TechnicalReportsPage = () => (
  <GenericHRPage title="Technical Reports" category="Technical" description="Generate and view technical project reports" />
);
