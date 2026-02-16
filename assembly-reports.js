// ============================================================================
// OFFICER AND COORDINATOR REPORT AUTOMATION
// Panel 65 - Washington Area Al-Anon
// 
// This script automatically:
// 1. Auto-calculates Panel number and Year from submission timestamp
// 2. Creates English report documents from form submissions
// 3. Creates Spanish translated versions using Spanish template
// 4. Handles both Assembly Reports and Newsletter Reports
// 5. Overwrites existing reports if person resubmits
// 6. Organizes them in the correct folder structure
// 7. Emails the submitter with links to both documents
// 8. Provides two-tier error handling (user errors vs system errors)
//
// Maintained by: Gary H (gareth.houk@gmail.com) - Panel 65 Chair
// ============================================================================

// ---------------------------------------------------------------------------
// CONFIGURATION - Update these values as needed
// ---------------------------------------------------------------------------

var CONFIG = {
  // Template document IDs
  englishTemplateId: '1qSAS949nahWxQEnXiJZUGLTlbiEFmfGk0SplzX48bvo',
  spanishTemplateId: '1rz17tYM7ull439sKJbmOtgkZn7egZ-vdF2HbdYX0LlU',
  
  // Public Shared Drive ID
  sharedDriveId: '0AKCQ-c_MoLypUk9PVA',
  
  // Admin emails for error notifications (by report type)
  assemblyAdminEmails: ['chair@wa-al-anon.org', 'gareth.houk@gmail.com'],
  newsletterAdminEmails: ['chair@wa-al-anon.org', 'gareth.houk@gmail.com'],
  
  // Position translations (English -> Spanish)
  positionTranslations: {
    'Delegate (Officer)': 'Delegado (Oficial)',
    'Alternate Delegate (Officer)': 'Delegado suplente (Oficial)',
    'Chair (Officer)': 'Presidente (Oficial)',
    'Alternate Chair (Officer)': 'Presidente suplente (Oficial)',
    'Treasurer (Officer)': 'Tesorero (Oficial)',
    'Secretary (Officer)': 'Secretario (Oficial)',
    'Archivist (Coordinator)': 'Archivista (Coordinador)',
    'Custodial Archivist': 'Archivista de custodia',
    'Group Records (Coordinator)': 'Registros de grupo (Coordinador)',
    'Literature (Coordinator)': 'Literatura (Coordinador)',
    'Meeting Technology (Coordinator)': 'Tecnología de reuniones (Coordinador)',
    'Newsletter (Coordinator)': 'Boletín informativo (Coordinador)',
    'Outreach (Coordinator)': 'Difusión (Coordinador)',
    'Pierce County AIS': 'AIS del condado de Pierce',
    'Seattle AIS': 'Seattle AIS',
    'Web Editor (Coordinator)': 'Editor web (Coordinador)',
    'Alateen (Coordinator)': 'Alateen (Coordinador)',
    'Area Alateen Process Person (Coordinator)': 'Coordinador del proceso de Alateen del área'
  }
};

// ---------------------------------------------------------------------------
// MAIN FUNCTION - Triggered when form is submitted
// ---------------------------------------------------------------------------

function onFormSubmit(e) {
  try {
    Logger.log('=== Script Started ===');
    
    // Get form responses
    var responses = e.namedValues;
    Logger.log('Form responses received: ' + JSON.stringify(responses));
    
    // Extract data from form submission
    var timestamp = new Date(responses['Timestamp'][0]);
    
    var data = {
      timestamp: timestamp,
      email: responses['email (must be of the form abc@wa-al-anon.org)'][0],
      name: responses['Name (First name and Last initial)'][0],
      position: responses['Position'][0],
      reportType: responses['Report Type'][0],
      assembly: responses['For which Assembly is this report?'] ? responses['For which Assembly is this report?'][0] : null,
      quarter: responses['For which Quarter is this Newsletter report?'] ? responses['For which Quarter is this Newsletter report?'][0] : null,
      text: responses['Report Text'][0]
    };
    
    // Auto-calculate Panel and Year from timestamp
    data.year = timestamp.getFullYear();
    data.panel = calculatePanel(data.year);
    
    // Format dates
    data.date = formatDateEnglish(timestamp);
    data.dateSpanish = formatDateSpanish(timestamp);
    
    // Translate position and text to Spanish
    data.positionSpanish = CONFIG.positionTranslations[data.position] || data.position;
    data.textSpanish = LanguageApp.translate(data.text, 'en', 'es');
    
    // Determine which admin emails to use
    var adminEmails = (data.reportType === 'Assembly Report') 
      ? CONFIG.assemblyAdminEmails 
      : CONFIG.newsletterAdminEmails;
    
    Logger.log('Processed data: Panel=' + data.panel + ', Year=' + data.year + 
               ', Type=' + data.reportType + ', Assembly=' + data.assembly + ', Quarter=' + data.quarter);
    
    // Validate submission
    var validationErrors = validateSubmission(data);
    if (validationErrors.length > 0) {
      Logger.log('Validation errors: ' + validationErrors.join('; '));
      sendUserErrorEmail(data, validationErrors);
      notifyAdminsOfValidation(data, validationErrors, adminEmails);
      return;
    }
    
    // Build the folder path based on report type
    var folderPath;
    if (data.reportType === 'Assembly Report') {
      folderPath = 'Panel ' + data.panel + '/' + data.year + '/' + data.assembly + '/Reports - Assemblies';
    } else {
      folderPath = 'Panel ' + data.panel + '/Newsletter/' + data.year + '/' + data.quarter;
    }
    
    Logger.log('Looking for folder path: ' + folderPath);
    
    var targetFolder = findFolderByPath(CONFIG.sharedDriveId, folderPath);
    
    if (!targetFolder) {
      throw new Error('Folder not found: ' + folderPath + '\nPlease verify the folder structure exists in the Public Shared Drive.');
    }
    
    Logger.log('Target folder found: ' + targetFolder.getName());
    
    // Build filenames based on report type
    var englishFilename, spanishFilename;
    
    if (data.reportType === 'Assembly Report') {
      englishFilename = 'Report-Panel ' + data.panel + '-' + data.year + '-' + 
                        data.assembly + '-' + data.position;
      spanishFilename = 'informe-Panel ' + data.panel + '-' + data.year + '-' + 
                        data.assembly + '-' + data.positionSpanish;
    } else {
      englishFilename = 'Report-Panel ' + data.panel + '-Newsletter-' + data.year + '-' + 
                        data.quarter + '-' + data.position;
      spanishFilename = 'informe-Panel ' + data.panel + '-Newsletter-' + data.year + '-' + 
                        data.quarter + '-' + data.positionSpanish;
    }
    
    // Check for and delete existing documents (overwrite behavior)
    deleteExistingDocument(targetFolder, englishFilename);
    deleteExistingDocument(targetFolder, spanishFilename);
    
    // Create English document
    Logger.log('Creating English document...');
    var englishDoc = createEnglishDocument(data, targetFolder, englishFilename);
    Logger.log('English doc created: ' + englishDoc.getUrl());
    
    // Create Spanish document
    Logger.log('Creating Spanish document...');
    var spanishDoc = createSpanishDocument(data, targetFolder, spanishFilename);
    Logger.log('Spanish doc created: ' + spanishDoc.getUrl());
    
    // Grant edit access to submitter
    englishDoc.addEditor(data.email);
    spanishDoc.addEditor(data.email);
    Logger.log('Edit access granted to: ' + data.email);
    
    // Send notification email
    sendSuccessEmail(data, englishDoc.getUrl(), spanishDoc.getUrl(), folderPath, adminEmails);
    Logger.log('Notification email sent');
    
    Logger.log('=== Script Completed Successfully ===');
    
  } catch (error) {
    Logger.log('SYSTEM ERROR: ' + error.toString());
    
    // Determine admin emails for error notification
    var errorAdminEmails = CONFIG.assemblyAdminEmails; // Default
    if (e.namedValues && e.namedValues['Report Type']) {
      var reportType = e.namedValues['Report Type'][0];
      errorAdminEmails = (reportType === 'Assembly Report') 
        ? CONFIG.assemblyAdminEmails 
        : CONFIG.newsletterAdminEmails;
    }
    
    // Send error notification to admins
    notifyAdminsOfSystemError(error, e, errorAdminEmails);
    
    // Re-throw error so it appears in execution log
    throw error;
  }
}

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS - CALCULATIONS
// ---------------------------------------------------------------------------

/**
 * Calculate panel number from year
 * Panel 65 = 2025-2027, Panel 68 = 2028-2030, etc.
 */
function calculatePanel(year) {
  var yearsSince2025 = year - 2025;
  var panelsSince65 = Math.floor(yearsSince2025 / 3);
  return 65 + (panelsSince65 * 3);
}

/**
 * Format date in English: "February 1, 2026"
 */
function formatDateEnglish(date) {
  var months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  
  var month = months[date.getMonth()];
  var day = date.getDate();
  var year = date.getFullYear();
  
  return month + ' ' + day + ', ' + year;
}

/**
 * Format date in Spanish: "1 de febrero de 2026"
 */
function formatDateSpanish(date) {
  var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  var mes = meses[date.getMonth()];
  var dia = date.getDate();
  var año = date.getFullYear();
  
  return dia + ' de ' + mes + ' de ' + año;
}

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS - VALIDATION
// ---------------------------------------------------------------------------

/**
 * Validate submission data
 * Returns array of error messages (empty if valid)
 */
function validateSubmission(data) {
  var errors = [];
  
  // Validate email format (should end with @wa-al-anon.org)
  if (!data.email.match(/@wa-al-anon\.org$/)) {
    errors.push('Invalid email format: must end with @wa-al-anon.org');
  }
  
  // Validate report type is selected
  if (!data.reportType) {
    errors.push('Report Type is required');
  }
  
  // Validate type-specific fields
  if (data.reportType === 'Assembly Report') {
    if (!data.assembly || data.assembly.trim() === '') {
      errors.push('Assembly selection is required for Assembly Reports');
    }
  } else if (data.reportType === 'Newsletter Report') {
    if (!data.quarter || data.quarter.trim() === '') {
      errors.push('Quarter selection is required for Newsletter Reports');
    }
  }
  
  // Validate report text is not empty
  if (!data.text || data.text.trim() === '') {
    errors.push('Report text cannot be empty');
  }
  
  return errors;
}

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS - FOLDER OPERATIONS
// ---------------------------------------------------------------------------

/**
 * Find folder by searching directly for the full path
 */
function findFolderByPath(sharedDriveId, path) {
  var pathParts = path.split('/');
  var targetFolderName = pathParts[pathParts.length - 1];
  
  Logger.log('Searching for folder named: ' + targetFolderName);
  
  var folders = DriveApp.getFoldersByName(targetFolderName);
  
  while (folders.hasNext()) {
    var folder = folders.next();
    var folderPath = buildFolderPath(folder);
    
    Logger.log('Found folder with path: ' + folderPath);
    Logger.log('Expected path: ' + path);
    
    if (folderPath === path) {
      Logger.log('Match found!');
      return folder;
    }
  }
  
  Logger.log('No matching folder found for path: ' + path);
  return null;
}

/**
 * Build the full path of a folder by walking up its parents
 */
function buildFolderPath(folder) {
  var pathParts = [];
  var currentFolder = folder;
  
  while (true) {
    pathParts.unshift(currentFolder.getName());
    
    var parents = currentFolder.getParents();
    if (!parents.hasNext()) {
      break;
    }
    
    currentFolder = parents.next();
  }
  
  // Remove Shared Drive name from path
  if (pathParts[0] === 'Public' || pathParts[0] === 'Drive') {
    pathParts.shift();
  }
  
  return pathParts.join('/');
}

/**
 * Delete existing document with given name in folder (for overwrite behavior)
 */
function deleteExistingDocument(folder, filename) {
  var files = folder.getFilesByName(filename);
  
  while (files.hasNext()) {
    var file = files.next();
    Logger.log('Deleting existing document: ' + filename);
    file.setTrashed(true);
  }
}

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS - DOCUMENT CREATION
// ---------------------------------------------------------------------------

/**
 * Create English document from template
 */
function createEnglishDocument(data, folder, filename) {
  Logger.log('Creating English document: ' + filename);
  
  var templateFile = DriveApp.getFileById(CONFIG.englishTemplateId);
  var newFile = templateFile.makeCopy(filename, folder);
  
  var doc = DocumentApp.openById(newFile.getId());
  var body = doc.getBody();
  
  // Replace all placeholders
  body.replaceText('\\{\\{NAME\\}\\}', data.name);
  body.replaceText('\\{\\{POSITION\\}\\}', data.position);
  body.replaceText('\\{\\{PANEL\\}\\}', data.panel.toString());
  body.replaceText('\\{\\{YEAR\\}\\}', data.year.toString());
  
  // Replace Assembly or Quarter based on report type
  if (data.reportType === 'Assembly Report') {
    body.replaceText('\\{\\{ASSEMBLY\\}\\}', data.assembly);
  } else {
    body.replaceText('\\{\\{ASSEMBLY\\}\\}', data.quarter);
  }
  
  body.replaceText('\\{\\{TEXT\\}\\}', data.text);
  body.replaceText('\\{\\{DATE\\}\\}', data.date);
  body.replaceText('\\{\\{EMAIL\\}\\}', data.email);
  
  doc.saveAndClose();
  
  return newFile;
}

/**
 * Create Spanish document from Spanish template
 */
function createSpanishDocument(data, folder, filename) {
  Logger.log('Creating Spanish document: ' + filename);
  
  var templateFile = DriveApp.getFileById(CONFIG.spanishTemplateId);
  var newFile = templateFile.makeCopy(filename, folder);
  
  var doc = DocumentApp.openById(newFile.getId());
  var body = doc.getBody();
  
  // Replace all placeholders
  body.replaceText('\\{\\{NAME\\}\\}', data.name);
  body.replaceText('\\{\\{POSITIONSPANISH\\}\\}', data.positionSpanish);
  body.replaceText('\\{\\{PANEL\\}\\}', data.panel.toString());
  body.replaceText('\\{\\{YEAR\\}\\}', data.year.toString());
  
  // Replace Assembly or Quarter based on report type
  if (data.reportType === 'Assembly Report') {
    body.replaceText('\\{\\{ASSEMBLY\\}\\}', data.assembly);
  } else {
    body.replaceText('\\{\\{ASSEMBLY\\}\\}', data.quarter);
  }
  
  body.replaceText('\\{\\{TEXTSPANISH\\}\\}', data.textSpanish);
  body.replaceText('\\{\\{DATESPANISH\\}\\}', data.dateSpanish);
  body.replaceText('\\{\\{EMAIL\\}\\}', data.email);
  
  doc.saveAndClose();
  
  return newFile;
}

// ---------------------------------------------------------------------------
// EMAIL FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Send success notification to submitter
 */
function sendSuccessEmail(data, englishUrl, spanishUrl, folderPath, adminEmails) {
  var subject = 'Your ' + data.reportType + ' Has Been Created - Panel ' + data.panel;
  
  var reportDetails = (data.reportType === 'Assembly Report')
    ? 'Assembly: ' + data.assembly
    : 'Quarter: ' + data.quarter;
  
  var body = 'Dear ' + data.name + ',\n\n' +
             'Thank you for submitting your ' + data.position + ' report.\n\n' +
             'REPORT DETAILS:\n' +
             'Type: ' + data.reportType + '\n' +
             'Panel: ' + data.panel + '\n' +
             'Year: ' + data.year + '\n' +
             reportDetails + '\n' +
             'Folder: Public/' + folderPath + '\n\n' +
             'Your reports have been created and you have edit access to both versions:\n\n' +
             'English Report:\n' + englishUrl + '\n\n' +
             'Spanish Report (Informe en español):\n' + spanishUrl + '\n\n' +
             'EDITING YOUR REPORT:\n' +
             'You can click the links above to edit these documents directly if you need to make corrections.\n\n' +
             'RESUBMITTING:\n' +
             'If you resubmit the form, it will overwrite these documents with your new submission.\n\n' +
             'If you have any questions, please contact the appropriate coordinator.\n\n' +
             'In loving service,\n' +
             'Washington Area Al-Anon';
  
  MailApp.sendEmail({
    to: data.email,
    cc: adminEmails.join(','),
    subject: subject,
    body: body
  });
}

/**
 * Send user-friendly error email for validation failures
 */
function sendUserErrorEmail(data, errors) {
  var subject = 'Issue with Your Report Submission';
  
  var body = 'Dear ' + data.name + ',\n\n' +
             'There was a problem processing your report submission:\n\n' +
             errors.map(function(e) { return '• ' + e; }).join('\n') + '\n\n' +
             'Please review your submission and try again.\n\n' +
             'If you believe this is an error, please contact chair@wa-al-anon.org\n\n' +
             'In loving service,\n' +
             'Washington Area Al-Anon';
  
  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: body
  });
}

/**
 * Notify admins of validation error (user mistake)
 */
function notifyAdminsOfValidation(data, errors, adminEmails) {
  var subject = 'Report Validation Error';
  
  var body = 'A user submitted a report with validation errors:\n\n' +
             'Submitter: ' + data.name + ' (' + data.email + ')\n' +
             'Position: ' + data.position + '\n' +
             'Report Type: ' + data.reportType + '\n\n' +
             'Validation Errors:\n' +
             errors.map(function(e) { return '• ' + e; }).join('\n') + '\n\n' +
             'The user has been notified and asked to resubmit.\n';
  
  MailApp.sendEmail({
    to: adminEmails.join(','),
    subject: subject,
    body: body
  });
}

/**
 * Notify admins of system error (script/infrastructure problem)
 */
function notifyAdminsOfSystemError(error, eventData, adminEmails) {
  var subject = 'SYSTEM ERROR in Report Automation';
  
  var body = 'A system error occurred while processing a report submission:\n\n' +
             'ERROR MESSAGE:\n' + error.toString() + '\n\n' +
             'STACK TRACE:\n' + (error.stack || 'No stack trace available') + '\n\n' +
             'FORM DATA:\n' + JSON.stringify(eventData.namedValues, null, 2) + '\n\n' +
             'Please check the Apps Script execution logs for details.\n';
  
  MailApp.sendEmail({
    to: adminEmails.join(','),
    subject: subject,
    body: body
  });
}