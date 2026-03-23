package com.sync.Antic.config;

import com.sync.Antic.entity.*;
import com.sync.Antic.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * DataInitializer — s'exécute au démarrage de l'application.
 *
 * Il crée, UNIQUEMENT si la base est vide :
 *   • Les 4 rôles   (super_admin, admin_cirt, directeur_antenne, agent)
 *   • 4 antennes    (Yaoundé, Douala, Garoua, Bafoussam)
 *   • 7 catégories  (Scans, Fermeture comptes, Veille, Collecte actifs, etc.)
 *   • Le compte super_admin initial
 *
 * Les credentials par défaut sont configurables via application.properties :
 *   init.admin.email    (défaut : admin@antic.cm)
 *   init.admin.password (défaut : Admin@1234!)
 *   init.admin.name     (défaut : Directeur CIRT)
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired private RoleRepository       roleRepository;
    @Autowired private UserRepository       userRepository;
    @Autowired private AntenneRepository    antenneRepository;
    @Autowired private CategoryRepository   categoryRepository;
    @Autowired private PasswordEncoder      passwordEncoder;

    @Value("${init.admin.email:admin@antic.cm}")
    private String adminEmail;

    @Value("${init.admin.password:Admin@1234!}")
    private String adminPassword;

    @Value("${init.admin.name:Directeur CIRT}")
    private String adminName;

    @Override
    public void run(String... args) {

        // ── 1. Rôles ────────────────────────────────────────────────────────
        Role superAdmin      = ensureRole("super_admin");
        Role adminCirt       = ensureRole("admin_cirt");
        Role directeurAntenne = ensureRole("directeur_antenne");
        Role agent           = ensureRole("agent");

        log.info("✅ Rôles initialisés");

        // ── 2. Antennes ──────────────────────────────────────────────────────
        ensureAntenne("Antenne Yaoundé");
        ensureAntenne("Antenne Douala");
        ensureAntenne("Antenne Garoua");
        ensureAntenne("Antenne Bafoussam");
        ensureAntenne("Antenne Bertoua");
        ensureAntenne("Antenne Ngaoundéré");

        log.info("✅ Antennes initialisées");

        // ── 3. Compte super_admin ────────────────────────────────────────────
        if (userRepository.findByEmail(adminEmail).isEmpty()) {

            User admin = new User();
            admin.setName(adminName);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(superAdmin);
            // super_admin n'est rattaché à aucune antenne
            userRepository.save(admin);

            log.info("✅ Compte super_admin créé → email: {}  /  mot de passe: {}",
                     adminEmail, adminPassword);
            log.warn("⚠️  Changez le mot de passe admin dès la première connexion !");

        } else {
            log.info("ℹ️  Compte super_admin déjà existant ({}), skipped.", adminEmail);
        }

        // ── 4. Catégories par défaut ─────────────────────────────────────────
        // On récupère le super_admin pour l'associer comme créateur
        User admin = userRepository.findByEmail(adminEmail).orElse(null);

        ensureCategory("Scans de Vulnérabilité",       admin);
        ensureCategory("Fermeture de Comptes",         admin);
        ensureCategory("Veille Informationnelle",      admin);
        ensureCategory("Collecte d'Actifs",            admin);
        ensureCategory("Base Points Focaux",           admin);
        ensureCategory("Réquisitions",                 admin);
        ensureCategory("Preuves Numériques",           admin);

        log.info("✅ Catégories initialisées");
        log.info("🚀 DataInitializer terminé — application prête.");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Role ensureRole(String name) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role r = new Role();
            r.setName(name);
            return roleRepository.save(r);
        });
    }

    private void ensureAntenne(String name) {
        boolean exists = antenneRepository.findAll()
                .stream()
                .anyMatch(a -> a.getName().equalsIgnoreCase(name));
        if (!exists) {
            Antenne a = new Antenne();
            a.setName(name);
            antenneRepository.save(a);
        }
    }

    private void ensureCategory(String name, User createdBy) {
        boolean exists = categoryRepository.findAll()
                .stream()
                .anyMatch(c -> c.getName().equalsIgnoreCase(name));
        if (!exists) {
            Category c = new Category();
            c.setName(name);
            c.setCreatedBy(createdBy);
            categoryRepository.save(c);
        }
    }
}
