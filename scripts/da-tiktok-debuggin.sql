
--CAMPAIGN IDS FOUND IN CROSSROADS TABLE-----------------------------------
SELECT DISTINCT campaign_id
  FROM crossroads
WHERE
  date = '2023-10-22'
AND traffic_source = 'tiktok';
---------------------------------------------------------------------------

--ROWS FOUND IN TIKTOK TABLE-----------------------------------------------
SELECT 
  campaign_id, date, total_spent
  FROM tiktok
WHERE
  campaign_id = '1780376504441873' AND date > '2023-10-10'

---------------------------------------------------------------------------

--DA TIKTOK CAMPAIGN IDS---------------------------------------------------
WITH restriction AS (
  SELECT DISTINCT campaign_id, adset_id
    FROM crossroads
  WHERE
    date = '2023-10-22'
  AND traffic_source = 'tiktok'
)
----------------------------------------------------------------------------

--TIKTOK DATA WITH CROSSROADS CAMPAIGN IDS----------------------------------
SELECT 
  tt.date, tt.campaign_id, tt.campaign_name, total_spent
FROM tiktok tt
  WHERE 
  tt.campaign_id IN (SELECT campaign_id FROM restriction) 
  AND date = '2023-10-22';
----------------------------------------------------------------------------
