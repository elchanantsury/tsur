-- הוספת תאריך ביקור ללקוחות פרטיים (להצגה בדף הבית)
ALTER TABLE private_clients
ADD COLUMN IF NOT EXISTS visit_date DATE;
