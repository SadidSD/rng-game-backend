-- Quick SQL to check colorIdentity values for white cards
SELECT 
  name, 
  "colorIdentity", 
  "manaCost",
  "typeLine"
FROM "Card"
WHERE name LIKE '%Hardlight%'
LIMIT 5;

-- Check all distinct colorIdentity values
SELECT DISTINCT "colorIdentity"
FROM "Card"
LIMIT 20;
