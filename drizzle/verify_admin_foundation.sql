-- Read-only verification. Expected: six application tables, five named indexes,
-- no foreign-key violations and zero rows immediately after initial migration.
SELECT type, name, sql FROM sqlite_master
WHERE name IN ('admin_users','developers','projects','developer_accounts','project_change_requests','admin_audit_logs',
'idx_projects_developer','idx_projects_name','idx_developers_name','idx_change_requests_status','idx_audit_created')
ORDER BY type, name;
PRAGMA foreign_key_check;
PRAGMA table_info(admin_users);
PRAGMA table_info(developers);
PRAGMA table_info(projects);
PRAGMA table_info(developer_accounts);
PRAGMA table_info(project_change_requests);
PRAGMA table_info(admin_audit_logs);
PRAGMA foreign_key_list(projects);
PRAGMA foreign_key_list(developer_accounts);
PRAGMA foreign_key_list(project_change_requests);
PRAGMA foreign_key_list(admin_audit_logs);
SELECT 'admin_users' AS entity, COUNT(*) AS records FROM admin_users;
SELECT 'developers' AS entity, COUNT(*) AS records FROM developers;
SELECT 'projects' AS entity, COUNT(*) AS records FROM projects;
SELECT 'developer_accounts' AS entity, COUNT(*) AS records FROM developer_accounts;
SELECT 'project_change_requests' AS entity, COUNT(*) AS records FROM project_change_requests;
SELECT 'admin_audit_logs' AS entity, COUNT(*) AS records FROM admin_audit_logs;
