-- Script d'initialisation des données de test
-- Application de Contrôle et Suivi Budgétaire EPA Congo-Brazzaville

-- Insertion d'un EPA de test
INSERT INTO epa (code, nom, secteur) VALUES
('EPA001', 'Hôpital Central de Brazzaville', 'Santé'),
('EPA002', 'Université Marien Ngouabi', 'Education'),
('EPA003', 'Office National des Routes', 'Infrastructure');

-- Insertion d'utilisateurs de test (mot de passe: "password123" hashé avec bcrypt)
-- Note: En production, utiliser bcrypt pour hasher les mots de passe
INSERT INTO utilisateurs (email, password_hash, nom, prenom, role_id, epa_id) VALUES
-- DG
('dg@epa001.cg', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Moukoko', 'Jean', 1, 1),
-- DAF
('daf@epa001.cg', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Kouba', 'Marie', 2, 1),
-- Contrôleur
('controleur@epa001.cg', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Mboumba', 'Pierre', 3, 1),
-- Comptable
('comptable@epa001.cg', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJq', 'Nkouka', 'Sophie', 4, 1),
-- Service Métier
('service@epa001.cg', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJq', 'Mabiala', 'Paul', 5, 1),
-- Tutelle
('tutelle@minfin.cg', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJq', 'Tutelle', 'Admin', 6, NULL),
-- CCDB
('ccdb@courcomptes.cg', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJq', 'CCDB', 'Auditeur', 7, NULL);

-- Insertion de programmes budgétaires
INSERT INTO programmes (epa_id, code, libelle, annee, budget_initial) VALUES
(1, 'P001', 'Programme Santé Publique', 2025, 500000000),
(1, 'P002', 'Programme Équipements Médicaux', 2025, 300000000),
(2, 'P001', 'Programme Formation', 2025, 400000000),
(3, 'P001', 'Programme Entretien Routes', 2025, 600000000);

-- Insertion de lignes budgétaires
INSERT INTO lignes_budgetaires (programme_id, code_nature, libelle, ae_initial, cp_initial, ae_restant, cp_restant, annee) VALUES
(1, '70.01', 'Fournitures médicales', 200000000, 200000000, 200000000, 200000000, 2025),
(1, '70.02', 'Médicaments', 150000000, 150000000, 150000000, 150000000, 2025),
(1, '70.03', 'Équipements médicaux', 150000000, 150000000, 150000000, 150000000, 2025),
(2, '70.04', 'Matériel médical', 300000000, 300000000, 300000000, 300000000, 2025);

-- Note: Pour les mots de passe, utiliser bcrypt en Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('password123', 10);

