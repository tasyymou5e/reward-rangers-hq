-- Data migration to populate primary_email_designator from existing data
-- This safely migrates existing families to use the primary parent's email as the designator

UPDATE families 
SET primary_email_designator = (
    SELECT p.email 
    FROM profiles p 
    WHERE p.id = families.parent_id
)
WHERE primary_email_designator IS NULL;