// Simplified storage utility to avoid circular dependencies
export const saveData = async (entry) => {
  try {
    const existing = JSON.parse(localStorage.getItem('esgData') || '[]');
    const enhancedEntry = {
      ...entry,
      id: entry.id || Date.now().toString(),
      createdAt: new Date().toISOString(),
      createdBy: localStorage.getItem('currentUser') || 'defaultUser'
    };
    
    existing.push(enhancedEntry);
    localStorage.setItem('esgData', JSON.stringify(existing));
    
    return { success: true, data: enhancedEntry };
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
};

export const getStoredData = async () => {
  try {
    const data = localStorage.getItem('esgData');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting stored data:', error);
    return [];
  }
};