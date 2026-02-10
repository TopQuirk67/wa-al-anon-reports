## 📖 UPDATED README.txt
```
================================================================================
ASSEMBLY REPORT AUTOMATION SYSTEM
Washington Area Al-Anon - Panel 65
================================================================================

OVERVIEW
--------
This system automatically processes Officer and Coordinator reports submitted 
via Google Form. When someone submits a report, the system:

1. Auto-calculates Panel number and Year from submission timestamp
2. Creates an English report document in the correct folder
3. Creates a Spanish version using a Spanish-language template
4. Gives the submitter edit access to both documents
5. Emails them links with folder location
6. Overwrites previous reports if they resubmit

AUTO-CALCULATED FIELDS
----------------------
Panel Number: Calculated from submission year
  - Panel 65: 2025-2027
  - Panel 68: 2028-2030
  - Panel 71: 2031-2033
  - Formula: 65 + 3 * floor((year - 2025) / 3)

Year: Extracted from submission timestamp

Users only need to select:
  - Assembly (dropdown: 1-AWSC-Feb, 2-Pre-Con, etc.)
  - Everything else is calculated or provided by them

FOLDER STRUCTURE
----------------
Reports are organized as:
Public / Panel XX / YYYY / Assembly Name / Reports - Assemblies /

Example: Public/Panel 65/2026/1-AWSC-Feb/Reports - Assemblies/

IMPORTANT: The folder structure MUST exist before reports are submitted.
The script will NOT create folders - it will throw an error if the path
doesn't exist.

DOCUMENT NAMING
---------------
English: Report-Panel 65-2026-1-AWSC-Feb-Chair (Officer)
Spanish: informe-Panel 65-2026-1-AWSC-Feb-Presidente (Oficial)

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

English placeholders:
{{NAME}}, {{POSITION}}, {{PANEL}}, {{YEAR}}, {{ASSEMBLY}}, {{TEXT}}, 
{{DATE}}, {{EMAIL}}

Spanish placeholders:
{{NAME}}, {{POSITIONSPANISH}}, {{PANEL}}, {{YEAR}}, {{ASSEMBLY}}, 
{{TEXTSPANISH}}, {{DATESPANISH}}, {{EMAIL}}

To modify templates:
1. Open the template document
2. Edit layout, formatting, headers, etc.
3. Keep the {{PLACEHOLDER}} tags where you want data inserted
4. Save the template
5. New reports will use the updated template

THE SCRIPT
----------
Location: The Google Sheet linked to the form
Access: Extensions → Apps Script

Key configuration values at the top (CONFIG object):
- englishTemplateId: English template doc
- spanishTemplateId: Spanish template doc
- sharedDriveId: The Public Shared Drive
- adminEmails: Who gets notified of errors
- positionTranslations: English-to-Spanish position mappings

ERROR HANDLING
--------------
Two-tier error system:

1. USER ERRORS (validation failures):
   - Invalid email format
   - Missing assembly selection
   - Empty report text
   → User gets friendly email explaining what to fix
   → Admins get notification for tracking

2. SYSTEM ERRORS (infrastructure problems):
   - Folder not found
   - Template broken
   - Permission issues
   → Admins get detailed error email
   → User sees generic error (doesn't expose internal details)

Admin emails currently set to:
- chair@wa-al-anon.org
- gareth.houk@gmail.com (for testing)

TROUBLESHOOTING
---------------
If reports aren't being created:

1. Check Executions (in Apps Script, click clock-with-arrow icon)
   - Look for error messages in failed executions
   
2. Check if user received error email
   - Validation error? They need to fix and resubmit
   - No email? Check system error notification to admins

3. Verify folder structure exists:
   Public/Panel XX/YYYY/Assembly-Name/Reports - Assemblies/

4. Check template IDs are correct in CONFIG

UPDATING FOR NEW PANELS
------------------------
NO CODE CHANGES NEEDED!

The script automatically calculates the panel number from the submission
date. When Panel 68 starts in 2028, it will automatically use Panel 68.

Just ensure the folder structure exists for new panels before people
start submitting reports.

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

CONTACT
-------
For questions or issues with this system:
Gary H, gareth.houk@gmail.com (Panel 65 Chair)

================================================================================
Last Updated: February 2026
Version: 2.0 (Auto-calculate Panel/Year, Spanish template, Overwrite mode)
================================================================================
