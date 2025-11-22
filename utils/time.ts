export interface TimezoneRegions {
  [region: string]: string[];
}

// Added aliases for common timezone names to improve search
export const timezoneAliases: Record<string, string[]> = {
    'America/Los_Angeles': ['California', 'Pacific Time (US)', 'West Coast', 'PST', 'PDT'],
    'America/New_York': ['New York', 'Eastern Time (US)', 'East Coast', 'EST', 'EDT'],
    'America/Chicago': ['Central Time (US)', 'CST', 'CDT'],
    'America/Denver': ['Mountain Time (US)', 'MST', 'MDT'],
    'Europe/London': ['London', 'UK', 'GMT', 'BST', 'United Kingdom'],
    'Europe/Paris': ['Paris', 'France', 'CET'],
    'Europe/Berlin': ['Berlin', 'Germany'],
    'Asia/Tokyo': ['Tokyo', 'Japan', 'JST'],
    'Australia/Sydney': ['Sydney', 'Australia', 'AEST'],
};

export const getTimezones = (): TimezoneRegions => {
  const regions: TimezoneRegions = {};
  
  try {
    // FIX: Cast `Intl` to `any` to resolve a TypeScript error where `supportedValuesOf`
    // is not in the default `Intl` type definition. The try-catch block handles
    // runtime environments where this method is not supported.
    const timezones = (Intl as any).supportedValuesOf('timeZone');
    
    timezones.forEach(tz => {
      // Filter out some less user-friendly timezones
      if (tz.startsWith('Etc/') || tz.startsWith('GMT') || tz.startsWith('UTC') || !tz.includes('/')) {
        return;
      }
      
      const parts = tz.split('/');
      const region = parts[0];
      
      if (parts.length > 1) {
        if (!regions[region]) {
          regions[region] = [];
        }
        regions[region].push(tz);
      }
    });
    
    // Sort cities within each region alphabetically
    for (const region in regions) {
      regions[region].sort((a, b) => {
        const cityA = a.substring(a.lastIndexOf('/') + 1).replace(/_/g, ' ');
        const cityB = b.substring(b.lastIndexOf('/') + 1).replace(/_/g, ' ');
        return cityA.localeCompare(cityB);
      });
    }

    return regions;
  } catch (e) {
    // Fallback for older browsers that don't support Intl.supportedValuesOf
    console.warn("Intl.supportedValuesOf('timeZone') is not supported. Using a limited timezone list.");
    return {
      "Africa": ["Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos"],
      "America": ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Sao_Paulo", "America/Toronto"],
      "Asia": ["Asia/Tokyo", "Asia/Shanghai", "Asia/Dubai", "Asia/Kolkata", "Asia/Seoul"],
      "Australia": ["Australia/Sydney", "Australia/Melbourne", "Australia/Perth"],
      "Europe": ["Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow", "Europe/Rome"],
      "Pacific": ["Pacific/Auckland", "Pacific/Fiji", "Pacific/Honolulu"],
    };
  }
};