import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, clients, incidentTypes, incidents, activityLogs, comments } from '../db/schema';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Create clients
    const [acmeClient, techCorpClient, globalSolutionsClient] = await db.insert(clients).values([
      {
        name: 'ACME Corporation',
        slug: 'acme',
        description: 'Leading manufacturing company',
        config: {
          incidentTypes: ['hardware-failure', 'software-bug', 'network-issue'],
          priorities: [1, 2, 3, 4, 5],
          notifications: { email: true, sms: false }
        }
      },
      {
        name: 'TechCorp Solutions',
        slug: 'techcorp',
        description: 'Technology consulting firm',
        config: {
          incidentTypes: ['system-outage', 'security-breach', 'data-corruption'],
          priorities: [1, 2, 3, 4, 5],
          notifications: { email: true, sms: true }
        }
      },
      {
        name: 'Global Solutions Inc',
        slug: 'global-solutions',
        description: 'Enterprise software provider',
        config: {
          incidentTypes: ['performance-issue', 'integration-failure', 'user-access'],
          priorities: [1, 2, 3, 4, 5],
          notifications: { email: true, sms: false }
        }
      }
    ]).returning();

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const [operatorUser, acmeClientUser, techCorpClientUser, globalClientUser] = await db.insert(users).values([
      {
        email: 'operator@example.com',
        password: hashedPassword,
        name: 'John Operator',
        role: 'operator'
      },
      {
        email: 'client@acme.com',
        password: hashedPassword,
        name: 'Alice Johnson',
        role: 'client',
        clientId: acmeClient.id
      },
      {
        email: 'admin@techcorp.com',
        password: hashedPassword,
        name: 'Bob Smith',
        role: 'client',
        clientId: techCorpClient.id
      },
      {
        email: 'support@globalsolutions.com',
        password: hashedPassword,
        name: 'Carol Williams',
        role: 'client',
        clientId: globalSolutionsClient.id
      }
    ]).returning();

    // Create incident types
    const incidentTypesList = await db.insert(incidentTypes).values([
      // ACME incident types
      {
        clientId: acmeClient.id,
        name: 'Hardware Failure',
        description: 'Equipment malfunction or breakdown',
        priority: 4,
        fields: [
          { name: 'equipment_id', type: 'text', label: 'Equipment ID', required: true },
          { name: 'location', type: 'text', label: 'Location', required: true },
          { name: 'error_code', type: 'text', label: 'Error Code', required: false }
        ]
      },
      {
        clientId: acmeClient.id,
        name: 'Software Bug',
        description: 'Application or system software issues',
        priority: 2,
        fields: [
          { name: 'application', type: 'text', label: 'Application', required: true },
          { name: 'steps_to_reproduce', type: 'textarea', label: 'Steps to Reproduce', required: true },
          { name: 'browser', type: 'text', label: 'Browser', required: false }
        ]
      },
      {
        clientId: acmeClient.id,
        name: 'Network Issue',
        description: 'Connectivity and network problems',
        priority: 3,
        fields: [
          { name: 'affected_area', type: 'text', label: 'Affected Area', required: true },
          { name: 'connection_type', type: 'select', label: 'Connection Type', options: ['WiFi', 'Ethernet', 'VPN'], required: true }
        ]
      },
      // TechCorp incident types
      {
        clientId: techCorpClient.id,
        name: 'System Outage',
        description: 'Complete or partial system unavailability',
        priority: 5,
        fields: [
          { name: 'affected_systems', type: 'textarea', label: 'Affected Systems', required: true },
          { name: 'impact_level', type: 'select', label: 'Impact Level', options: ['Low', 'Medium', 'High', 'Critical'], required: true }
        ]
      },
      {
        clientId: techCorpClient.id,
        name: 'Security Breach',
        description: 'Potential or confirmed security incidents',
        priority: 5,
        fields: [
          { name: 'incident_type', type: 'select', label: 'Incident Type', options: ['Malware', 'Phishing', 'Data Breach', 'Unauthorized Access'], required: true },
          { name: 'affected_data', type: 'textarea', label: 'Affected Data', required: true }
        ]
      },
      // Global Solutions incident types
      {
        clientId: globalSolutionsClient.id,
        name: 'Performance Issue',
        description: 'System or application performance problems',
        priority: 2,
        fields: [
          { name: 'response_time', type: 'number', label: 'Response Time (ms)', required: true },
          { name: 'user_count', type: 'number', label: 'Affected Users', required: true }
        ]
      }
    ]).returning();

    // Create sample incidents
    const sampleIncidents = await db.insert(incidents).values([
      {
        clientId: acmeClient.id,
        incidentTypeId: incidentTypesList[0].id, // Hardware Failure
        title: 'Production Line 3 Equipment Malfunction',
        description: 'Main conveyor belt motor stopped working during peak production hours',
        status: 'open',
        priority: 4,
        reportedBy: acmeClientUser.id,
        assignedTo: operatorUser.id,
        data: {
          equipment_id: 'CONV-003-A',
          location: 'Factory Floor 3',
          error_code: 'E001'
        }
      },
      {
        clientId: acmeClient.id,
        incidentTypeId: incidentTypesList[1].id, // Software Bug
        title: 'Inventory System Login Error',
        description: 'Users unable to log into inventory management system',
        status: 'in_progress',
        priority: 3,
        reportedBy: acmeClientUser.id,
        assignedTo: operatorUser.id,
        data: {
          application: 'Inventory Management System',
          steps_to_reproduce: '1. Navigate to login page\n2. Enter valid credentials\n3. Click login\n4. Error message appears',
          browser: 'Chrome 120.0'
        }
      },
      {
        clientId: techCorpClient.id,
        incidentTypeId: incidentTypesList[3].id, // System Outage
        title: 'Email Service Down',
        description: 'Complete email system outage affecting all departments',
        status: 'escalated',
        priority: 5,
        reportedBy: techCorpClientUser.id,
        assignedTo: operatorUser.id,
        data: {
          affected_systems: 'Exchange Server, Outlook Web App, Mobile clients',
          impact_level: 'Critical'
        }
      },
      {
        clientId: globalSolutionsClient.id,
        incidentTypeId: incidentTypesList[5].id, // Performance Issue
        title: 'Customer Portal Slow Response',
        description: 'Customer portal experiencing slow response times during business hours',
        status: 'completed',
        priority: 2,
        reportedBy: globalClientUser.id,
        assignedTo: operatorUser.id,
        data: {
          response_time: 8500,
          user_count: 150
        },
        resolvedAt: new Date()
      }
    ]).returning();

    // Create activity logs for incidents
    await db.insert(activityLogs).values([
      {
        incidentId: sampleIncidents[0].id,
        userId: acmeClientUser.id,
        action: 'created',
        description: 'Incident created: Production Line 3 Equipment Malfunction'
      },
      {
        incidentId: sampleIncidents[0].id,
        userId: operatorUser.id,
        action: 'assigned',
        description: 'Incident assigned to John Operator'
      },
      {
        incidentId: sampleIncidents[1].id,
        userId: acmeClientUser.id,
        action: 'created',
        description: 'Incident created: Inventory System Login Error'
      },
      {
        incidentId: sampleIncidents[1].id,
        userId: operatorUser.id,
        action: 'status_changed',
        description: 'Status changed from open to in_progress'
      },
      {
        incidentId: sampleIncidents[2].id,
        userId: techCorpClientUser.id,
        action: 'created',
        description: 'Incident created: Email Service Down'
      },
      {
        incidentId: sampleIncidents[2].id,
        userId: operatorUser.id,
        action: 'status_changed',
        description: 'Status changed from open to escalated'
      },
      {
        incidentId: sampleIncidents[3].id,
        userId: globalClientUser.id,
        action: 'created',
        description: 'Incident created: Customer Portal Slow Response'
      },
      {
        incidentId: sampleIncidents[3].id,
        userId: operatorUser.id,
        action: 'status_changed',
        description: 'Status changed from open to completed'
      }
    ]);

    // Create sample comments
    await db.insert(comments).values([
      {
        incidentId: sampleIncidents[0].id,
        userId: acmeClientUser.id,
        content: 'This is causing major production delays. Please prioritize.',
        isInternal: false
      },
      {
        incidentId: sampleIncidents[0].id,
        userId: operatorUser.id,
        content: 'Dispatching maintenance team to Factory Floor 3.',
        isInternal: true
      },
      {
        incidentId: sampleIncidents[1].id,
        userId: operatorUser.id,
        content: 'Investigating the authentication service. Will provide update within 2 hours.',
        isInternal: false
      },
      {
        incidentId: sampleIncidents[2].id,
        userId: techCorpClientUser.id,
        content: 'This is affecting our entire organization. Critical business impact.',
        isInternal: false
      },
      {
        incidentId: sampleIncidents[3].id,
        userId: operatorUser.id,
        content: 'Performance issue resolved after database optimization.',
        isInternal: false
      }
    ]);

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('Operator: operator@example.com / password123');
    console.log('ACME Client: client@acme.com / password123');
    console.log('TechCorp Client: admin@techcorp.com / password123');
    console.log('Global Solutions Client: support@globalsolutions.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
