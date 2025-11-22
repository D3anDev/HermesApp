import { DashboardLayout, HomeTile } from '../types';

export const PREDEFINED_LAYOUTS: DashboardLayout[] = [
  {
    id: 'default',
    name: 'Default',
    isEditable: false,
    layout: [
      { id: HomeTile.ContinueWatching, x: 0, y: 0, w: 2, h: 1 },
      { id: HomeTile.Stats, x: 0, y: 1, w: 1, h: 1 },
      { id: HomeTile.Upcoming, x: 1, y: 1, w: 1, h: 1 },
    ],
  },
  {
    id: 'stats-view-focused',
    name: 'Stats Focused',
    isEditable: false,
    layout: [
      { id: HomeTile.Stats, x: 0, y: 0, w: 1, h: 2 },
      { id: HomeTile.ContinueWatching, x: 1, y: 0, w: 1, h: 1 },
      { id: HomeTile.Upcoming, x: 1, y: 1, w: 1, h: 1 },
    ],
  },
];

export const CUSTOM_LAYOUT_ID = 'custom';