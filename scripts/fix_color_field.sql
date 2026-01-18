-- Fix inventory color field data cleanup
-- This script identifies and fixes color fields that contain extra text

-- Step 1: Identify records with color > 50 characters (likely has extra text)
SELECT 
    id, 
    inventory_code, 
    color, 
    LENGTH(color) as color_length
FROM inventory
WHERE LENGTH(color) > 50
ORDER BY color_length DESC;

-- Step 2: Preview what the fix would do
SELECT 
    id,
    inventory_code,
    color as old_color,
    TRIM(REGEXP_REPLACE(color, '(\u51fa\u8377\u65e5|\u304a\u5c4a\u3051\u4e88\u5b9a\u65e5|\u914d\u9001|\u00a5|\u5186).*$', '')) as new_color,
    LENGTH(color) as old_length,
    LENGTH(TRIM(REGEXP_REPLACE(color, '(\u51fa\u8377\u65e5|\u304a\u5c4a\u3051\u4e88\u5b9a\u65e5|\u914d\u9001|\u00a5|\u5186).*$', ''))) as new_length
FROM inventory
WHERE LENGTH(color) > 50;

-- Step 3: Apply the fix (run this after reviewing the preview)
UPDATE inventory
SET color = TRIM(REGEXP_REPLACE(color, '(\u51fa\u8377\u65e5|\u304a\u5c4a\u3051\u4e88\u5b9a\u65e5|\u914d\u9001|\u00a5|\u5186).*$', ''))
WHERE LENGTH(color) > 50;

-- Step 4: Verify the fix
SELECT 
    id, 
    inventory_code, 
    color, 
    LENGTH(color) as color_length
FROM inventory
WHERE id IN (
    SELECT id FROM inventory WHERE LENGTH(color) > 50
)
ORDER BY color_length DESC;
