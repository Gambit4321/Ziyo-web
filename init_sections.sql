INSERT INTO HomeSection (id, `order`, isVisible, type, title, sourceType, displayStyle, updatedAt) 
VALUES 
(MD5(RAND()), 5, 1, 'BANNER', 'Yangi Banner', 'CATEGORY', 'CAROUSEL', NOW()), 
(MD5(RAND()), 6, 1, 'AUDIO', 'AUDIOMAHSULOTLAR', 'CATEGORY', 'CAROUSEL', NOW());
