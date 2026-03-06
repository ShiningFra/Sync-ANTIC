CREATE DATABASE antic_platform;
USE antic_platform;

-- =========================
-- TABLE ROLES
-- =========================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (name) VALUES
('ADMIN'),
('ANNEXE');


-- =========================
-- TABLE USERS
-- =========================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    username VARCHAR(100) UNIQUE NOT NULL,
    
    password VARCHAR(255) NOT NULL,
    
    role_id INT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id)
);


-- =========================
-- TABLE CATEGORIES
-- =========================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    name VARCHAR(200) NOT NULL
);

INSERT INTO categories (name) VALUES
('Scans de vulnérabilité'),
('Fermeture de comptes'),
('Veille informationnelle'),
('Collecte des actifs TIC des entreprises'),
('Mise à jour des points focaux'),
('Réquisitions'),
('Authentification de preuve numérique');


-- =========================
-- TABLE DOSSIERS
-- =========================
CREATE TABLE dossiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    title VARCHAR(255) NOT NULL,
    
    description TEXT,
    
    category_id INT NOT NULL,
    
    created_by INT NOT NULL,
    
    status ENUM('PENDING','VALIDATED','REJECTED') DEFAULT 'PENDING',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    validated_at TIMESTAMP NULL,
    
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);


-- =========================
-- TABLE FILES
-- =========================
CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    dossier_id INT NOT NULL,
    
    file_name VARCHAR(255),
    
    file_path VARCHAR(500),
    
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (dossier_id) REFERENCES dossiers(id)
);