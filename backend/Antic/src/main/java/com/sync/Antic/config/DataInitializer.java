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
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired private RoleRepository          roleRepo;
    @Autowired private UserRepository          userRepo;
    @Autowired private AntenneRepository       antenneRepo;
    @Autowired private CategoryRepository      categoryRepo;
    @Autowired private SousDirectionRepository sousDirectionRepo;
    @Autowired private ServiceCirtRepository   serviceCirtRepo;
    @Autowired private PasswordEncoder         passwordEncoder;

    @Value("${init.admin.email:admin@antic.cm}")
    private String adminEmail;
    @Value("${init.admin.password:Admin@1234!}")
    private String adminPassword;
    @Value("${init.admin.name:Directeur CIRT}")
    private String adminName;

    @Override
    @Transactional
    public void run(String... args) {

        // ── 1. Rôles ──────────────────────────────────────────────────────────
        Role superAdmin       = ensureRole("super_admin");
        Role adminCirt        = ensureRole("admin_cirt");
        Role chefService      = ensureRole("chef_service");
        Role directeurAntenne = ensureRole("directeur_antenne");
        Role agentCirt        = ensureRole("agent_cirt");
        Role agentAntenne     = ensureRole("agent_antenne");
        log.info("✅ 6 rôles initialisés");

        // ── 2. Structure CIRT ─────────────────────────────────────────────────
        SousDirection sdSecurite  = ensureSousDirection("Sous-direction Sécurité des SI");
        SousDirection sdJuridique = ensureSousDirection("Sous-direction Juridique et Réquisitions");
        SousDirection sdVeille    = ensureSousDirection("Sous-direction Veille et Intelligence");

        ensureService("Service Scans de Vulnérabilité",  sdSecurite);
        ensureService("Service Fermeture de Comptes",    sdSecurite);
        ensureService("Service Preuves Numériques",      sdSecurite);
        ensureService("Service Réquisitions",            sdJuridique);
        ensureService("Service Veille Informationnelle", sdVeille);
        ensureService("Service Collecte d'Actifs",       sdVeille);
        ensureService("Service Points Focaux",           sdVeille);
        log.info("✅ Structure CIRT initialisée");

        // ── 3. Antennes ───────────────────────────────────────────────────────
        ensureAntenne("Antenne Yaoundé");
        ensureAntenne("Antenne Douala");
        ensureAntenne("Antenne Garoua");
        ensureAntenne("Antenne Bafoussam");
        ensureAntenne("Antenne Bertoua");
        ensureAntenne("Antenne Ngaoundéré");
        log.info("✅ 6 antennes initialisées");

        // ── 4. Super Admin ────────────────────────────────────────────────────
        User admin = userRepo.findByEmail(adminEmail).orElse(null);

        if (admin == null) {
            admin = new User();
            admin.setName(adminName);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(superAdmin);
            admin.setActive(true);          // ← EXPLICITEMENT ACTIF
            userRepo.save(admin);
            log.info("✅ Super Admin créé → {}", adminEmail);
            log.warn("⚠️  Changez le mot de passe admin avant la production !");
        } else {
            // Forcer active=true sur le compte existant (fix migration)
            if (!admin.isActive()) {
                admin.setActive(true);
                userRepo.save(admin);
                log.info("✅ Super Admin réactivé → {}", adminEmail);
            } else {
                log.info("ℹ️  Super Admin déjà existant ({})", adminEmail);
            }
        }

        // Fix global : activer tous les comptes qui seraient inactive par défaut
        // (cas d'une migration depuis l'ancienne version sans colonne 'active')
        long fixed = userRepo.findAll().stream()
            .filter(u -> !u.isActive())
            .peek(u -> u.setActive(true))
            .map(userRepo::save)
            .count();
        if (fixed > 0) {
            log.info("✅ {} compte(s) réactivé(s) (migration colonne 'active')", fixed);
        }

        // ── 5. Catégories ─────────────────────────────────────────────────────
        final User finalAdmin = userRepo.findByEmail(adminEmail).orElse(null);
        ensureCategory("Scans de Vulnérabilité",  finalAdmin);
        ensureCategory("Fermeture de Comptes",    finalAdmin);
        ensureCategory("Veille Informationnelle", finalAdmin);
        ensureCategory("Collecte d'Actifs",       finalAdmin);
        ensureCategory("Base Points Focaux",      finalAdmin);
        ensureCategory("Réquisitions",            finalAdmin);
        ensureCategory("Preuves Numériques",      finalAdmin);
        log.info("✅ 7 catégories initialisées");

        log.info("🚀 Plateforme CIRT-ANTIC prête.");
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private Role ensureRole(String name) {
        return roleRepo.findByName(name).orElseGet(() -> {
            Role r = new Role(); r.setName(name);
            return roleRepo.save(r);
        });
    }

    private SousDirection ensureSousDirection(String name) {
        return sousDirectionRepo.findAll().stream()
            .filter(sd -> sd.getName().equalsIgnoreCase(name))
            .findFirst()
            .orElseGet(() -> {
                SousDirection sd = new SousDirection(); sd.setName(name);
                return sousDirectionRepo.save(sd);
            });
    }

    private ServiceCirt ensureService(String name, SousDirection sd) {
        return serviceCirtRepo.findAll().stream()
            .filter(s -> s.getName().equalsIgnoreCase(name))
            .findFirst()
            .orElseGet(() -> {
                ServiceCirt s = new ServiceCirt();
                s.setName(name); s.setSousDirection(sd);
                return serviceCirtRepo.save(s);
            });
    }

    private void ensureAntenne(String name) {
        boolean exists = antenneRepo.findAll().stream()
            .anyMatch(a -> a.getName().equalsIgnoreCase(name));
        if (!exists) {
            Antenne a = new Antenne(); a.setName(name);
            antenneRepo.save(a);
        }
    }

    private void ensureCategory(String name, User createdBy) {
        boolean exists = categoryRepo.findAll().stream()
            .anyMatch(c -> c.getName().equalsIgnoreCase(name));
        if (!exists) {
            Category c = new Category();
            c.setName(name); c.setCreatedBy(createdBy);
            categoryRepo.save(c);
        }
    }
}
