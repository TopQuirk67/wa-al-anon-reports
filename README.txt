================================================================================
ASSEMBLY AND NEWSLETTER REPORT AUTOMATION SYSTEM
Washington Area Al-Anon - Panel 65
================================================================================

OVERVIEW
--------
This system automatically processes Officer and Coordinator reports submitted 
via Google Form. It handles both Assembly Reports and Newsletter Reports.

When someone submits a report, the system:
1. Auto-calculates Panel number and Year from submission timestamp
2. Creates an English report document in the correct folder
3. Creates a Spanish version using a Spanish-language template
4. Gives the submitter edit access to both documents
5. Emails them links with folder location
6. CCs the appropriate coordinator (Secretary for Assembly, Newsletter for Newsletter)
7. Overwrites previous reports if they resubmit

REPORT TYPES
------------
The form supports two types of reports:

1. ASSEMBLY REPORTS
   - Submitted for specific assemblies (1-AWSC-Feb, 2-Pre-Con, etc.)
   - Filed in: Panel XX/YYYY/Assembly-Name/Reports - Assemblies/
   - CCs: secretary@wa-al-anon.org (and gareth.houk@gmail.com for testing)

2. NEWSLETTER REPORTS
   - Submitted for quarterly newsletters (Q1, Q2, Q3, Q4)
   - Filed in: Panel XX/Newsletter/YYYY/Quarter/
   - CCs: newsletter@wa-al-anon.org (and gareth.houk@gmail.com for testing)

AUTO-CALCULATED FIELDS
----------------------
Panel Number: Calculated from submission year
  - Panel 65: 2025-2027
  - Panel 68: 2028-2030
  - Panel 71: 2031-2033
  - Formula: 65 + 3 * floor((year - 2025) / 3)

Year: Extracted from submission timestamp

Users only need to provide:
  - Email, Name, Position
  - Report Type (Assembly or Newsletter)
  - Assembly name OR Quarter (depending on type)
  - Report Text

FORM STRUCTURE
--------------
The form uses conditional logic (sections):

Section 1: Common Questions
  - Email
  - Name (First name and Last initial)
  - Position
  - Report Type (branches to Section 2 or 3)

Section 2: Assembly Reports (if Assembly selected)
  - Assembly dropdown (1-AWSC-Feb, 2-Pre-Con, etc.)
  - Goes to Section 4

Section 3: Newsletter Reports (if Newsletter selected)
  - Quarter dropdown (Q1, Q2, Q3, Q4)
  - Goes to Section 4

Section 4: Common Final Questions
  - Report Text
  - Submit

FOLDER STRUCTURE
----------------
Reports are organized differently based on type:

ASSEMBLY REPORTS:
Public/Panel XX/YYYY/Assembly-Name/Reports - Assemblies/
Example: Public/Panel 65/2026/1-AWSC-Feb/Reports - Assemblies/

NEWSLETTER REPORTS:
Public/Panel XX/Newsletter/YYYY/Quarter/
Example: Public/Panel 65/Newsletter/2026/Q1/

IMPORTANT: The folder structure MUST exist before reports are submitted.
The script will NOT create folders - it will throw an error if the path
doesn't exist.

DOCUMENT NAMING
---------------
Assembly Reports:
  English: Report-Panel 65-2026-1-AWSC-Feb-Chair (Officer)
  Spanish: informe-Panel 65-2026-1-AWSC-Feb-Presidente (Oficial)

Newsletter Reports:
  English: Report-Panel 65-Newsletter-2026-Q1-Newsletter (Coordinator)
  Spanish: informe-Panel 65-Newsletter-2026-Q1-Boletín informativo (Coordinador)

OVERWRITE BEHAVIOR
------------------
If someone resubmits the form, the script will DELETE the old documents
and create new ones. This prevents duplicate reports for the same person.

Users are informed that they can either:
1. Edit the Google Doc directly (recommended for small changes)
2. Resubmit the form (which will overwrite the existing docs)

TEMPLATE DOCUMENTS
------------------
English Template ID: 1qSAS949nahWxQEnXiJZUGLTlbiEFmfGk0SplzX48bvo
Spanish Template ID: 1rz17tYM7ull439sKJbmOtgkZn7egZ-vdF2HbdYX0LlU

Both templates work for both Assembly and Newsletter reports!

English placeholders:
{{NAME}}, {{POSITION}}, {{PANEL}}, {{YEAR}}, {{ASSEMBLY}}, {{TEXT}}, 
{{DATE}}, {{EMAIL}}

Note: {{ASSEMBLY}} will contain either the assembly name (1-AWSC-Feb) 
or the quarter (Q1) depending on report type.

Spanish placeholders:
{{NAME}}, {{POSITIONSPANISH}}, {{PANEL}}, {{YEAR}}, {{ASSEMBLY}}, 
{{TEXTSPANISH}}, {{DATESPANISH}}, {{EMAIL}}

To modify templates:
1. Open the template document
2. Edit layout, formatting, headers, etc.
3. Keep the {{PLACEHOLDER}} tags where you want data inserted
4. The template works for both report types - no need for separate templates
5. Save the template
6. New reports will use the updated template

THE SCRIPT
----------
Location: The Google Sheet linked to the form
Access: Extensions → Apps Script

Key configuration values at the top (CONFIG object):
- englishTemplateId: English template doc
- spanishTemplateId: Spanish template doc
- sharedDriveId: The Public Shared Drive
- assemblyAdminEmails: Who gets CC'd on Assembly reports
- newsletterAdminEmails: Who gets CC'd on Newsletter reports
- positionTranslations: English-to-Spanish position mappings

ADMIN EMAIL ADDRESSES
---------------------
Currently configured for testing:

Assembly Reports:
  - secretary@wa-al-anon.org
  - gareth.houk@gmail.com

Newsletter Reports:
  - newsletter@wa-al-anon.org
  - gareth.houk@gmail.com

To change after testing: Edit CONFIG.assemblyAdminEmails and 
CONFIG.newsletterAdminEmails in the script.

ERROR HANDLING
--------------
Two-tier error system:

1. USER ERRORS (validation failures):
   - Invalid email format
   - Missing report type selection
   - Missing assembly/quarter selection
   - Empty report text
   → User gets friendly email explaining what to fix
   → Appropriate admins get notification for tracking

2. SYSTEM ERRORS (infrastructure problems):
   - Folder not found
   - Template broken
   - Permission issues
   → Appropriate admins get detailed error email
   → User sees generic error

The system automatically determines which admins to notify based on
the Report Type selected.

TROUBLESHOOTING
---------------
If reports aren't being created:

1. Check Executions (in Apps Script, click clock-with-arrow icon)
   - Look for error messages in failed executions
   
2. Check if user received error email
   - Validation error? They need to fix and resubmit
   - No email? Check system error notification to admins

3. Verify folder structure exists:
   - Assembly: Panel XX/YYYY/Assembly-Name/Reports - Assemblies/
   - Newsletter: Panel XX/Newsletter/YYYY/Quarter/

4. Check template IDs are correct in CONFIG

5. Verify form field names match exactly:
   - Timestamp
   - email (must be of the form abc@wa-al-anon.org)
   - Name (First name and Last initial)
   - Position
   - Report Type
   - For which Assembly is this report?
   - For which Quarter is this Newsletter report?
   - Report Text

UPDATING FOR NEW PANELS
------------------------
NO CODE CHANGES NEEDED!

The script automatically calculates the panel number from the submission
date. When Panel 68 starts in 2028, it will automatically use Panel 68.

Just ensure the folder structure exists for new panels before people
start submitting reports. Remember to create BOTH:
- Panel 68/YYYY/... (for Assembly reports)
- Panel 68/Newsletter/YYYY/... (for Newsletter reports)

POSITION TRANSLATIONS
---------------------
The script includes a mapping of English → Spanish position titles in
the CONFIG.positionTranslations object.

If a position is not in the mapping, the English title will be used in
the Spanish document.

To add/update position translations:
1. Open Apps Script
2. Find CONFIG.positionTranslations
3. Add or modify entries in the format:
   'English Position': 'Spanish Position',
4. Save the script

SPANISH TRANSLATION
-------------------
The report TEXT is automatically translated from English to Spanish using
Google's LanguageApp.translate() service.

The date is also formatted appropriately:
- English: February 1, 2026
- Spanish: 1 de febrero de 2026

Quality: The translation is automatic (Google Translate quality). Users
understand this and appreciate the effort. Professional translation is
not expected.

SPREADSHEET STRUCTURE
---------------------
The linked spreadsheet will have these columns:

- Timestamp
- email (must be of the form abc@wa-al-anon.org)
- Name (First name and Last initial)
- Position
- Report Type
- For which Assembly is this report? (blank for Newsletter reports)
- For which Quarter is this Newsletter report? (blank for Assembly reports)
- Report Text

Note: Assembly and Quarter columns will have blank values depending on
which type of report was submitted. This is normal and expected.

CONTACT
-------
For questions or issues with this system:
Gary H, gareth.houk@gmail.com (Panel 65 Chair)

GitHub Repository: [Add your repo URL here when created]

================================================================================
Last Updated: February 2026
Version: 2.0 (Dual report types: Assembly + Newsletter)
================================================================================