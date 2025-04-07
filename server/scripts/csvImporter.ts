import fs from 'fs';
import csvParser from 'csv-parser';
import { db } from '../db';
import * as schema from '@shared/schema';
import { hashPassword } from '../services/authService';
import path from 'path';

/**
 * Generic function to import CSV data into the database
 * @param csvFilePath Path to the CSV file
 * @param tableName Name of the table to import data into
 * @param transformer Optional function to transform each row before inserting
 * @returns Promise with the number of rows imported
 */
export async function importCsvToDatabase<T>(
  csvFilePath: string,
  tableName: string,
  transformer?: (row: any) => Promise<T> | T
): Promise<number> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const fullPath = path.resolve(csvFilePath);

    if (!fs.existsSync(fullPath)) {
      reject(new Error(`CSV file not found: ${fullPath}`));
      return;
    }

    fs.createReadStream(fullPath)
      .pipe(csvParser())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        console.log(`CSV file ${csvFilePath} successfully processed, found ${results.length} rows`);
        
        try {
          let transformedResults = results;
          if (transformer) {
            transformedResults = await Promise.all(results.map(transformer));
          }

          // Get the appropriate table from schema
          const table = getTableByName(tableName);
          if (!table) {
            reject(new Error(`Table not found: ${tableName}`));
            return;
          }

          // Insert data into the database
          const inserted = await db.insert(table).values(transformedResults).returning();
          console.log(`Successfully imported ${inserted.length} rows into ${tableName}`);
          resolve(inserted.length);
        } catch (error) {
          console.error(`Error importing data into ${tableName}:`, error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error(`Error reading CSV file ${csvFilePath}:`, error);
        reject(error);
      });
  });
}

/**
 * Helper function to get the appropriate table from schema
 * @param tableName Name of the table
 * @returns Table object from schema or undefined
 */
function getTableByName(tableName: string): any {
  switch (tableName) {
    case 'users':
      return schema.users;
    case 'family_members':
      return schema.familyMembers;
    case 'relationships':
      return schema.relationships;
    case 'events':
      return schema.events;
    case 'documents':
      return schema.documents;
    case 'help_requests':
      return schema.helpRequests;
    case 'messages':
      return schema.messages;
    default:
      return undefined;
  }
}

/**
 * Import users from CSV file
 * @param csvFilePath Path to the CSV file
 * @returns Promise with the number of users imported
 */
export async function importUsers(csvFilePath: string): Promise<number> {
  return importCsvToDatabase(csvFilePath, 'users', async (row) => {
    // Hash password if provided
    if (row.password) {
      row.password = await hashPassword(row.password);
    }
    
    // Convert boolean strings to actual booleans
    if (row.is_active) {
      row.is_active = row.is_active.toLowerCase() === 'true';
    }
    
    // Format dates
    if (row.last_login_date) {
      row.last_login_date = new Date(row.last_login_date);
    }
    
    return row;
  });
}

/**
 * Import family members from CSV file
 * @param csvFilePath Path to the CSV file
 * @returns Promise with the number of family members imported
 */
export async function importFamilyMembers(csvFilePath: string): Promise<number> {
  return importCsvToDatabase(csvFilePath, 'family_members', (row) => {
    // Convert user_id to number or null
    if (row.user_id) {
      row.user_id = parseInt(row.user_id);
    } else {
      row.user_id = null;
    }
    
    // Format dates
    if (row.birth_date) {
      row.birth_date = new Date(row.birth_date);
    }
    
    // Parse metadata JSON if it exists
    if (row.metadata && typeof row.metadata === 'string') {
      try {
        row.metadata = JSON.parse(row.metadata);
      } catch (e) {
        row.metadata = {};
      }
    } else {
      row.metadata = {};
    }
    
    return row;
  });
}

/**
 * Import relationships from CSV file
 * @param csvFilePath Path to the CSV file
 * @returns Promise with the number of relationships imported
 */
export async function importRelationships(csvFilePath: string): Promise<number> {
  return importCsvToDatabase(csvFilePath, 'relationships', (row) => {
    // Convert IDs to numbers
    if (row.source_id) {
      row.source_id = parseInt(row.source_id);
    }
    
    if (row.target_id) {
      row.target_id = parseInt(row.target_id);
    }
    
    return row;
  });
}

/**
 * Import events from CSV file
 * @param csvFilePath Path to the CSV file
 * @returns Promise with the number of events imported
 */
export async function importEvents(csvFilePath: string): Promise<number> {
  return importCsvToDatabase(csvFilePath, 'events', (row) => {
    // Convert user_id to number
    if (row.user_id) {
      row.user_id = parseInt(row.user_id);
    }
    
    // Format dates
    if (row.date) {
      row.date = new Date(row.date);
    }
    
    // Parse attendees JSON if it exists
    if (row.attendees && typeof row.attendees === 'string') {
      try {
        row.attendees = JSON.parse(row.attendees);
      } catch (e) {
        row.attendees = [];
      }
    } else {
      row.attendees = [];
    }
    
    return row;
  });
}

/**
 * Import documents from CSV file
 * @param csvFilePath Path to the CSV file
 * @returns Promise with the number of documents imported
 */
export async function importDocuments(csvFilePath: string): Promise<number> {
  return importCsvToDatabase(csvFilePath, 'documents', (row) => {
    // Convert user_id to number
    if (row.user_id) {
      row.user_id = parseInt(row.user_id);
    }
    
    // Format dates
    if (row.created_at) {
      row.created_at = new Date(row.created_at);
    } else {
      row.created_at = new Date();
    }
    
    // Parse permissions JSON if it exists
    if (row.permissions && typeof row.permissions === 'string') {
      try {
        row.permissions = JSON.parse(row.permissions);
      } catch (e) {
        row.permissions = {};
      }
    } else {
      row.permissions = {};
    }
    
    return row;
  });
}

/**
 * Import help requests from CSV file
 * @param csvFilePath Path to the CSV file
 * @returns Promise with the number of help requests imported
 */
export async function importHelpRequests(csvFilePath: string): Promise<number> {
  return importCsvToDatabase(csvFilePath, 'help_requests', (row) => {
    // Convert requestedBy to number
    if (row.requested_by) {
      row.requestedBy = parseInt(row.requested_by);
      delete row.requested_by;
    }
    
    // Format dates
    if (row.date_needed) {
      row.dateNeeded = new Date(row.date_needed);
      delete row.date_needed;
    }
    
    // Parse volunteers JSON if it exists
    if (row.volunteers && typeof row.volunteers === 'string') {
      try {
        row.volunteers = JSON.parse(row.volunteers);
      } catch (e) {
        row.volunteers = [];
      }
    } else {
      row.volunteers = [];
    }
    
    return row;
  });
}

/**
 * Import messages from CSV file
 * @param csvFilePath Path to the CSV file
 * @returns Promise with the number of messages imported
 */
export async function importMessages(csvFilePath: string): Promise<number> {
  return importCsvToDatabase(csvFilePath, 'messages', (row) => {
    // Convert IDs to numbers
    if (row.sender_id) {
      row.senderId = parseInt(row.sender_id);
      delete row.sender_id;
    }
    
    if (row.receiver_id) {
      row.receiverId = parseInt(row.receiver_id);
      delete row.receiver_id;
    }
    
    if (row.group_id) {
      row.groupId = parseInt(row.group_id);
      delete row.group_id;
    }
    
    // Convert booleans
    if (row.is_group_message) {
      row.isGroupMessage = row.is_group_message.toLowerCase() === 'true';
      delete row.is_group_message;
    }
    
    if (row.is_read) {
      row.isRead = row.is_read.toLowerCase() === 'true';
      delete row.is_read;
    }
    
    // Format dates
    if (row.sent_at) {
      row.sentAt = new Date(row.sent_at);
      delete row.sent_at;
    } else {
      row.sentAt = new Date();
    }
    
    return row;
  });
}