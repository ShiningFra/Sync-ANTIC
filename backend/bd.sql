CREATE DATABASE cirt_db;
USE cirt_db;


-- =========================
-- DATABASE: CIRT SYSTEM (MySQL)
-- =========================

-- =========================
-- ROLES
-- =========================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

INSERT INTO roles (name) VALUES
('super_admin'),
('admin_cirt'),
('directeur_antenne'),
('agent');

-- =========================
-- ANTENNES
-- =========================
CREATE TABLE antennes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role_id INT NOT NULL,
    antenne_id INT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (antenne_id) REFERENCES antennes(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================
-- CATEGORIES
-- =========================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- DOSSIERS
-- =========================
CREATE TABLE dossiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    created_by INT NOT NULL,
    antenne_id INT NOT NULL,
    status ENUM('en_cours', 'valide', 'archive') DEFAULT 'en_cours',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP NULL,

    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (antenne_id) REFERENCES antennes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- ETAPES
-- =========================
CREATE TABLE etapes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dossier_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- DOCUMENTS
-- =========================
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etape_id INT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (etape_id) REFERENCES etapes(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- PERMISSIONS (CATEGORIES)
-- =========================
CREATE TABLE permissions_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,

    UNIQUE KEY unique_user_category (user_id, category_id),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- INDEXES
-- =========================
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_dossiers_antenne ON dossiers(antenne_id);
CREATE INDEX idx_dossiers_category ON dossiers(category_id);
CREATE INDEX idx_dossiers_status ON dossiers(status);
CREATE INDEX idx_etapes_dossier ON etapes(dossier_id);
CREATE INDEX idx_documents_etape ON documents(etape_id);