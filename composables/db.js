import Dexie from 'dexie';

export const useDb = () => {
  const db = new Dexie('pomocraft-main');
  db.version(1).stores({
    pomo: 'id++, timestamp, taskId, projectId', // Primary key and indexed props
    task: 'id++, projectId, active',
    project: 'id++, active'
  });
  db.version(2).stores({
    pomo: 'id++, timestamp, taskId, projectId',
    task: 'id++, projectId, active, sortOrder',
    project: 'id++, active'
  });

  return db;
};
