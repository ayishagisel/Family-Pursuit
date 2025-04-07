import fs from 'fs';
import path from 'path';
import { 
  importCsvToDatabase, 
  importUsers, 
  importFamilyMembers, 
  importRelationships,
  importEvents,
  importDocuments,
  importHelpRequests,
  importMessages
} from '../scripts/csvImporter';
import { db } from '../db';

// Mock the DB and file system
jest.mock('../db');
jest.mock('fs');
jest.mock('csv-parser', () => {
  return () => {
    const { Readable } = require('stream');
    const stream = new Readable({ objectMode: true });
    stream._read = () => {};
    
    // Push mock data
    setTimeout(() => {
      stream.push({ name: 'John Doe', role: 'Father' });
      stream.push({ name: 'Jane Doe', role: 'Mother' });
      stream.push(null); // End of stream
    }, 0);
    
    return stream;
  };
});

describe('CSV Importer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fs.createReadStream
    (fs.createReadStream as jest.Mock).mockImplementation(() => {
      const { Readable } = require('stream');
      const stream = new Readable();
      stream._read = () => {};
      return stream;
    });
    
    // Mock db.insert().values().returning()
    const mockReturning = jest.fn().mockResolvedValue([{ id: 1 }]);
    const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
    const mockInsert = jest.fn().mockReturnValue({ values: mockValues });
    (db.insert as jest.Mock).mockReturnValue({ values: mockValues });
  });

  describe('importCsvToDatabase', () => {
    it('should import CSV data with transformation', async () => {
      const result = await importCsvToDatabase('mock/path.csv', 'users', (row) => ({
        ...row,
        transformed: true
      }));
      
      expect(result).toBe(2); // 2 mock rows
      expect(fs.createReadStream).toHaveBeenCalledWith('mock/path.csv');
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('importUsers', () => {
    it('should import users from CSV', async () => {
      const result = await importUsers('mock/users.csv');
      
      expect(result).toBe(2); // 2 mock rows
      expect(fs.createReadStream).toHaveBeenCalledWith('mock/users.csv');
    });
  });

  describe('importFamilyMembers', () => {
    it('should import family members from CSV', async () => {
      const result = await importFamilyMembers('mock/family_members.csv');
      
      expect(result).toBe(2); // 2 mock rows
      expect(fs.createReadStream).toHaveBeenCalledWith('mock/family_members.csv');
    });
  });

  describe('importRelationships', () => {
    it('should import relationships from CSV', async () => {
      const result = await importRelationships('mock/relationships.csv');
      
      expect(result).toBe(2); // 2 mock rows
      expect(fs.createReadStream).toHaveBeenCalledWith('mock/relationships.csv');
    });
  });

  // Add more specific tests for other import functions as needed
});