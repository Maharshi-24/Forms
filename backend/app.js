import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';
import fs from 'fs/promises';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'css')));

// Middleware to check if user is authenticated
const authenticateUser = (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.redirect('/login.html');
  }
  // You might want to check if the user exists in the database here
  req.userId = userId;
  next();
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

app.get('/index.html', authenticateUser, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(userId, username, hashedPassword);
    res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid username or password' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Invalid username or password' });
    }
    res.json({ success: true, userId: user.id, username: user.username });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/submit-form', authenticateUser, async (req, res) => {
  try {
    const { formName, formData } = req.body;
    const userId = req.userId;
    const username = db.prepare('SELECT username FROM users WHERE id = ?').get(userId).username;
    const submissionTime = new Date().toISOString();

    console.log('Received form submission:', formName, formData);
    let query = '';
    switch (formName) {
      case 'Information Security Policy Review':
        query = `
          UPDATE information_security_policy 
          SET policy_title = ?, review_date = ?, reviewed_by = ?, review_outcome = ?, comments = ?, modified_on = ?, modified_by = ?
          WHERE id = ? AND user_id = ?
        `;
        db.prepare(query).run(
          formData.policy_title,
          formData.review_date,
          formData.reviewed_by,
          formData.review_outcome,
          formData.comments,
          modifiedOn,
          username,
          submissionId,
          userId
        );
        break;

      case 'Information Security Roles':
        query = `
          INSERT INTO information_security_roles 
          (role, responsible_person, security_responsibilities, date_assigned, review_frequency, comments, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.role,
          formData.responsible_person,
          formData.security_responsibilities,
          formData.date_assigned,
          formData.review_frequency,
          formData.comments,
          submissionTime,
          username
        );
        break;

      case 'Employee Screening and Training':
        query = `
          INSERT INTO employee_screening 
          (employee_name, employee_id, position, screening_date, training_completed, training_date, termination_date, training_status, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.employee_name,
          formData.employee_id,
          formData.position,
          formData.screening_date,
          formData.training_completed,
          formData.training_date,
          formData.termination_date,
          formData.training_status,
          submissionTime,
          username
        );
        break;

      case 'Asset Management':
        query = `
          INSERT INTO asset_management 
          (asset_id, asset_type, owner, classification, location, date_added, end_of_life, status, comments, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.asset_id,
          formData.asset_type,
          formData.owner,
          formData.classification,
          formData.location,
          formData.date_added,
          formData.end_of_life,
          formData.status,
          formData.comments,
          submissionTime,
          username
        );
        break;

      case 'Access Control':
        query = `
          INSERT INTO access_control 
          (employee_name, department, access_requested, reason_for_access, requested_by, date_of_request, approved_by, access_granted, access_dates, comments, type_of_access, access_duration, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.employee_name,
          formData.department,
          formData.access_requested,
          formData.reason_for_access,
          formData.requested_by,
          formData.date_of_request,
          formData.approved_by,
          formData.access_granted,
          formData.access_dates,
          formData.comments,
          formData.type_of_access,
          formData.access_duration,
          submissionTime,
          username
        );
        break;

      case 'Cryptographic Controls':
        query = `
          INSERT INTO cryptography_controls 
          (control_type, system_application, purpose, implementation_date, key_management_process, key_expiration_date, comments, key_backup_location, algorithm, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.control_type,
          formData.system_application,
          formData.purpose,
          formData.implementation_date,
          formData.key_management_process,
          formData.key_expiration_date,
          formData.comments,
          formData.key_backup_location,
          formData.algorithm,
          submissionTime,
          username
        );
        break;

      case 'Physical Security':
        query = `
          INSERT INTO physical_security 
          (location, date_of_inspection, physical_barriers, entry_control_systems, secure_storage_areas, fire_protection_systems, alarm_systems, comments, inspection_frequency, access_approval_authority, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.location,
          formData.date_of_inspection,
          formData.physical_barriers,
          formData.entry_control_systems,
          formData.secure_storage_areas,
          formData.fire_protection_systems,
          formData.alarm_systems,
          formData.comments,
          formData.inspection_frequency,
          formData.access_approval_authority,
          submissionTime,
          username
        );
        break;

      case 'Operations Security':
        query = `
          INSERT INTO operations_security 
          (date, system_application, activity_description, performed_by, actions_taken, review_outcome, comments, escalation_contact, downtime_log, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.date,
          formData.system_application,
          formData.activity_description,
          formData.performed_by,
          formData.actions_taken,
          formData.review_outcome,
          formData.comments,
          formData.escalation_contact,
          formData.downtime_log,
          submissionTime,
          username
        );
        break;

      case 'Network Incidents':
        query = `
          INSERT INTO network_incidents 
          (date_of_incident, incident_description, system_affected, incident_response_actions, status, severity_level, incident_handler, resolution_date, encryption_standard, monitoring_details, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.date_of_incident,
          formData.incident_description,
          formData.system_affected,
          formData.incident_response_actions,
          formData.status,
          formData.severity_level,
          formData.incident_handler,
          formData.resolution_date,
          formData.encryption_standard,
          formData.monitoring_details,
          submissionTime,
          username
        );
        break;

      case 'Development Checklist':
        query = `
          INSERT INTO development_checklist 
          (project_name, date, security_requirements_defined, secure_coding_practices, code_review_conducted, vulnerability_testing, security_features, comments, risk_assessment, checklist_completed, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.project_name,
          formData.date,
          formData.security_requirements_defined,
          formData.secure_coding_practices,
          formData.code_review_conducted,
          formData.vulnerability_testing,
          formData.security_features,
          formData.comments,
          formData.risk_assessment,
          formData.checklist_completed,
          submissionTime,
          username
        );
        break;

      case 'Supplier Assessments':
        query = `
          INSERT INTO supplier_assessments 
          (supplier_name, service_products, security_requirements, audits_performed, audit_date, audit_findings, action_plan, comments, contract_validity, compliance_agreement, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.supplier_name,
          formData.service_products,
          formData.security_requirements,
          formData.audits_performed,
          formData.audit_date,
          formData.audit_findings,
          formData.action_plan,
          formData.comments,
          formData.contract_validity,
          formData.compliance_agreement,
          submissionTime,
          username
        );
        break;

      case 'Incident Responses':
        query = `
          INSERT INTO incident_responses 
          (incident_id, date_of_incident, incident_description, severity, impact_assessment, actions_taken, resolution_date, handled_by, post_incident_review_date, root_cause_analysis, incident_response_details, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.incident_id,
          formData.date_of_incident,
          formData.incident_description,
          formData.severity,
          formData.impact_assessment,
          formData.actions_taken,
          formData.resolution_date,
          formData.handled_by,
          formData.post_incident_review_date,
          formData.root_cause_analysis,
          formData.incident_response_details,
          submissionTime,
          username
        );
        break;

      case 'Business Continuity':
        query = `
          INSERT INTO business_continuity 
          (test_date, test_objective, test_scenario, outcome, issues_identified, follow_up_actions, tested_by, next_test_date, alternative_location, test_results, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.test_date,
          formData.test_objective,
          formData.test_scenario,
          formData.outcome,
          formData.issues_identified,
          formData.follow_up_actions,
          formData.tested_by,
          formData.next_test_date,
          formData.alternative_location,
          formData.test_results,
          submissionTime,
          username
        );
        break;

      case 'Compliance Checklist':
        query = `
          INSERT INTO compliance_checklist 
          (legislation_regulation, compliance_requirement, compliance_review_date, compliance_status, non_compliance_issues, action_plan, review_completed_by, internal_audit_date, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.legislation_regulation,
          formData.compliance_requirement,
          formData.compliance_review_date,
          formData.compliance_status,
          formData.non_compliance_issues,
          formData.action_plan,
          formData.review_completed_by,
          formData.internal_audit_date,
          submissionTime,
          username
        );
        break;

      default:
        return res.status(400).json({ error: 'Invalid form name' });
    }
    
    console.log('Form data inserted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in form submission:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/edit-form', authenticateUser, async (req, res) => {
  try {
    const { formName, formData, submissionId } = req.body;
    const userId = req.userId;
    const username = db.prepare('SELECT username FROM users WHERE id = ?').get(userId).username;
    const modifiedOn = new Date().toISOString();

    console.log('Received form edit:', formName, formData, submissionId);
    let query = '';
    switch (formName) {
      case 'Information Security Policy Review':
        query = `
          UPDATE information_security_policy 
          SET policy_title = ?, review_date = ?, reviewed_by = ?, review_outcome = ?, comments = ?, modified_on = ?, modified_by = ?
          WHERE id = ? AND user_id = ?
        `;
        db.prepare(query).run(
          formData.policy_title,
          formData.review_date,
          formData.reviewed_by,
          formData.review_outcome,
          formData.comments,
          modifiedOn,
          username,
          submissionId,
          userId
        );
        break;

      case 'Information Security Roles':
        query = `
          INSERT INTO information_security_roles 
          (role, responsible_person, security_responsibilities, date_assigned, review_frequency, comments, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.role,
          formData.responsible_person,
          formData.security_responsibilities,
          formData.date_assigned,
          formData.review_frequency,
          formData.comments,
          submissionTime,
          username
        );
        break;

      case 'Employee Screening and Training':
        query = `
          INSERT INTO employee_screening 
          (employee_name, employee_id, position, screening_date, training_completed, training_date, termination_date, training_status, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.employee_name,
          formData.employee_id,
          formData.position,
          formData.screening_date,
          formData.training_completed,
          formData.training_date,
          formData.termination_date,
          formData.training_status,
          submissionTime,
          username
        );
        break;

      case 'Asset Management':
        query = `
          INSERT INTO asset_management 
          (asset_id, asset_type, owner, classification, location, date_added, end_of_life, status, comments, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.asset_id,
          formData.asset_type,
          formData.owner,
          formData.classification,
          formData.location,
          formData.date_added,
          formData.end_of_life,
          formData.status,
          formData.comments,
          submissionTime,
          username
        );
        break;

      case 'Access Control':
        query = `
          INSERT INTO access_control 
          (employee_name, department, access_requested, reason_for_access, requested_by, date_of_request, approved_by, access_granted, access_dates, comments, type_of_access, access_duration, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.employee_name,
          formData.department,
          formData.access_requested,
          formData.reason_for_access,
          formData.requested_by,
          formData.date_of_request,
          formData.approved_by,
          formData.access_granted,
          formData.access_dates,
          formData.comments,
          formData.type_of_access,
          formData.access_duration,
          submissionTime,
          username
        );
        break;

      case 'Cryptographic Controls':
        query = `
          INSERT INTO cryptography_controls 
          (control_type, system_application, purpose, implementation_date, key_management_process, key_expiration_date, comments, key_backup_location, algorithm, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.control_type,
          formData.system_application,
          formData.purpose,
          formData.implementation_date,
          formData.key_management_process,
          formData.key_expiration_date,
          formData.comments,
          formData.key_backup_location,
          formData.algorithm,
          submissionTime,
          username
        );
        break;

      case 'Physical Security':
        query = `
          INSERT INTO physical_security 
          (location, date_of_inspection, physical_barriers, entry_control_systems, secure_storage_areas, fire_protection_systems, alarm_systems, comments, inspection_frequency, access_approval_authority, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.location,
          formData.date_of_inspection,
          formData.physical_barriers,
          formData.entry_control_systems,
          formData.secure_storage_areas,
          formData.fire_protection_systems,
          formData.alarm_systems,
          formData.comments,
          formData.inspection_frequency,
          formData.access_approval_authority,
          submissionTime,
          username
        );
        break;

      case 'Operations Security':
        query = `
          INSERT INTO operations_security 
          (date, system_application, activity_description, performed_by, actions_taken, review_outcome, comments, escalation_contact, downtime_log, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.date,
          formData.system_application,
          formData.activity_description,
          formData.performed_by,
          formData.actions_taken,
          formData.review_outcome,
          formData.comments,
          formData.escalation_contact,
          formData.downtime_log,
          submissionTime,
          username
        );
        break;

      case 'Network Incidents':
        query = `
          INSERT INTO network_incidents 
          (date_of_incident, incident_description, system_affected, incident_response_actions, status, severity_level, incident_handler, resolution_date, encryption_standard, monitoring_details, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.date_of_incident,
          formData.incident_description,
          formData.system_affected,
          formData.incident_response_actions,
          formData.status,
          formData.severity_level,
          formData.incident_handler,
          formData.resolution_date,
          formData.encryption_standard,
          formData.monitoring_details,
          submissionTime,
          username
        );
        break;

      case 'Development Checklist':
        query = `
          INSERT INTO development_checklist 
          (project_name, date, security_requirements_defined, secure_coding_practices, code_review_conducted, vulnerability_testing, security_features, comments, risk_assessment, checklist_completed, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.project_name,
          formData.date,
          formData.security_requirements_defined,
          formData.secure_coding_practices,
          formData.code_review_conducted,
          formData.vulnerability_testing,
          formData.security_features,
          formData.comments,
          formData.risk_assessment,
          formData.checklist_completed,
          submissionTime,
          username
        );
        break;

      case 'Supplier Assessments':
        query = `
          INSERT INTO supplier_assessments 
          (supplier_name, service_products, security_requirements, audits_performed, audit_date, audit_findings, action_plan, comments, contract_validity, compliance_agreement, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.supplier_name,
          formData.service_products,
          formData.security_requirements,
          formData.audits_performed,
          formData.audit_date,
          formData.audit_findings,
          formData.action_plan,
          formData.comments,
          formData.contract_validity,
          formData.compliance_agreement,
          submissionTime,
          username
        );
        break;

      case 'Incident Responses':
        query = `
          INSERT INTO incident_responses 
          (incident_id, date_of_incident, incident_description, severity, impact_assessment, actions_taken, resolution_date, handled_by, post_incident_review_date, root_cause_analysis, incident_response_details, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.incident_id,
          formData.date_of_incident,
          formData.incident_description,
          formData.severity,
          formData.impact_assessment,
          formData.actions_taken,
          formData.resolution_date,
          formData.handled_by,
          formData.post_incident_review_date,
          formData.root_cause_analysis,
          formData.incident_response_details,
          submissionTime,
          username
        );
        break;

      case 'Business Continuity':
        query = `
          INSERT INTO business_continuity 
          (test_date, test_objective, test_scenario, outcome, issues_identified, follow_up_actions, tested_by, next_test_date, alternative_location, test_results, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.test_date,
          formData.test_objective,
          formData.test_scenario,
          formData.outcome,
          formData.issues_identified,
          formData.follow_up_actions,
          formData.tested_by,
          formData.next_test_date,
          formData.alternative_location,
          formData.test_results,
          submissionTime,
          username
        );
        break;

      case 'Compliance Checklist':
        query = `
          INSERT INTO compliance_checklist 
          (legislation_regulation, compliance_requirement, compliance_review_date, compliance_status, non_compliance_issues, action_plan, review_completed_by, internal_audit_date, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.legislation_regulation,
          formData.compliance_requirement,
          formData.compliance_review_date,
          formData.compliance_status,
          formData.non_compliance_issues,
          formData.action_plan,
          formData.review_completed_by,
          formData.internal_audit_date,
          submissionTime,
          username
        );
        break;

      default:
        return res.status(400).json({ error: 'Invalid form name' });
    }
    
    console.log('Form data updated successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in form edit:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/roles', async (req, res) => {
  try {
    const roles = db.prepare('SELECT role_name FROM roles').all();
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.get('/api/extract-data', async (req, res) => {
  try {
    const formName = req.query.formName;
    if (!formName) {
      return res.status(400).json({ error: 'Form name is required' });
    }

    const query = `SELECT * FROM ${formName}`;
    const rows = db.prepare(query).all();

    res.json(rows);
  } catch (error) {
    console.error('Error extracting data:', error);
    res.status(500).json({ error: 'Failed to extract data' });
  }
});

app.post('/api/logout', (req, res) => {
  // In a real application, you might want to invalidate the session here
  res.json({ success: true });
});

app.get('/api/user-submissions', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const formName = req.query.formName;
    
    let query = '';
    switch (formName) {
      case 'Information Security Policy Review':
        query = 'SELECT id, policy_title, submission_time FROM information_security_policy WHERE user_id = ?';
        break;
      // Add cases for other forms
      default:
        return res.status(400).json({ error: 'Invalid form name' });
    }
    
    const submissions = db.prepare(query).all(userId);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ error: 'Failed to fetch user submissions' });
  }
});

app.get('/api/submission/:formName/:id', authenticateUser, async (req, res) => {
  try {
    const { formName, id } = req.params;
    const userId = req.userId;
    
    let query = '';
    switch (formName) {
      case 'Information Security Policy Review':
        query = 'SELECT * FROM information_security_policy WHERE id = ? AND user_id = ?';
        break;
      // Add cases for other forms
      default:
        return res.status(400).json({ error: 'Invalid form name' });
    }
    
    const submission = db.prepare(query).get(id, userId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

export default app;

