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

    @Autowired private RoleRepository            roleRepo;
    @Autowired private UserRepository            userRepo;
    @Autowired private AntenneRepository         antenneRepo;
    @Autowired private CategoryRepository        categoryRepo;
    @Autowired private SousDirectionRepository   sousDirectionRepo;
    @Autowired private ServiceCirtRepository     serviceCirtRepo;
    @Autowired private AntenneCategoryRepository antenneCatRepo;
    @Autowired private PasswordEncoder           passwordEncoder;

    @Value("${init.superadmin.email:superadmin@antic.cm}")
    private String superAdminEmail;
    @Value("${init.superadmin.password:SuperAdmin@1234!}")
    private String superAdminPassword;
    @Value("${init.superadmin.name:Super Administrateur}")
    private String superAdminName;

    @Override
    @Transactional
    public void run(String... args) {

        // ── 1. Rôles ──────────────────────────────────────────────────────────
        // Hiérarchie : super_admin > directeur > admin_cirt > chef_service / agent_cirt
        //                                      > directeur_antenne > agent_antenne
        ensureRole("super_admin");       // Rôle technique suprême
        ensureRole("directeur");         // Directeur CIRT (créé par super_admin)
        ensureRole("admin_cirt");        // Sous-directeur (créé par directeur)
        ensureRole("chef_service");      // Chef de service (créé par admin_cirt)
        ensureRole("directeur_antenne"); // Directeur d'antenne (créé par directeur)
        ensureRole("agent_cirt");        // Agent CIRT (créé par admin_cirt)
        ensureRole("agent_antenne");     // Agent d'antenne (créé par directeur_antenne)
        log.info("✅ 7 rôles initialisés");

        // ── 2. Structure CIRT ─────────────────────────────────────────────────
        SousDirection sdSecurite  = ensureSousDirection("Sous-direction de la securite Reactive");
        SousDirection sdJuridique = ensureSousDirection("Sous-direction Juridique et Réquisitions");
        SousDirection sdVeille    = ensureSousDirection("Sous-direction Veille et Intelligence");

        ensureService("Service de la Securite Proactive", sdSecurite);
        ensureService("Service Fermeture de Comptes",     sdSecurite);
        ensureService("Service Preuves Numériques",       sdSecurite);
        ensureService("Service Veille Informationnelle",  sdVeille);
        ensureService("Service Collecte d'Actifs",        sdVeille);
        ensureService("Service Points Focaux",            sdVeille);
        ensureService("Service Réquisitions",             sdJuridique);
        log.info("✅ Structure CIRT initialisée");

        // ── 3. Antennes ───────────────────────────────────────────────────────
        Antenne aDla = ensureAntenne("Antenne Douala");
        Antenne aGar = ensureAntenne("Antenne Garoua");
        Antenne aBaf = ensureAntenne("Antenne Bafoussam");
        Antenne aBer = ensureAntenne("Antenne Bertoua");
        Antenne aNga = ensureAntenne("Antenne Ngaoundéré");
        log.info("✅ 5 antennes initialisées");

        // ── 4. Super Administrateur ───────────────────────────────────────────
        Role superAdminRole = roleRepo.findByName("super_admin").orElseThrow();
        User superAdmin = userRepo.findByEmail(superAdminEmail).orElse(null);

        if (superAdmin == null) {
            superAdmin = new User();
            superAdmin.setName(superAdminName);
            superAdmin.setEmail(superAdminEmail);
            superAdmin.setPassword(passwordEncoder.encode(superAdminPassword));
            superAdmin.setRole(superAdminRole);
            superAdmin.setActive(true);
            userRepo.save(superAdmin);
            log.info("✅ Super Administrateur créé → {}", superAdminEmail);
            log.warn("⚠️  Changez le mot de passe avant la production !");
        } else {
            if (!superAdmin.isActive()) {
                superAdmin.setActive(true);
                userRepo.save(superAdmin);
            }
            log.info("ℹ️  Super Administrateur déjà existant ({})", superAdminEmail);
        }

        // ── 5. Catégories ─────────────────────────────────────────────────────
        final User finalSuperAdmin = userRepo.findByEmail(superAdminEmail).orElse(null);
        Category catScan    = ensureCategory("Scans de Vulnérabilité",  finalSuperAdmin);
        Category catFerme   = ensureCategory("Fermeture de Comptes",    finalSuperAdmin);
        Category catVeille  = ensureCategory("Veille Informationnelle", finalSuperAdmin);
        Category catActifs  = ensureCategory("Collecte d'Actifs",       finalSuperAdmin);
        Category catFocaux  = ensureCategory("Base Points Focaux",      finalSuperAdmin);
        Category catReq     = ensureCategory("Réquisitions",            finalSuperAdmin);
        Category catPreuves = ensureCategory("Preuves Numériques",      finalSuperAdmin);
        log.info("✅ 7 catégories initialisées");

        // ── 6. Affiliations catégories ↔ antennes (toutes par défaut) ─────────
        Antenne[] antennes = {aDla, aGar, aBaf, aBer, aNga};
        Category[] categories = {catScan, catFerme, catVeille, catActifs, catFocaux, catReq, catPreuves};
        for (Antenne a : antennes) {
            for (Category c : categories) {
                if (!antenneCatRepo.existsByAntenneIdAndCategoryId(a.getId(), c.getId())) {
                    AntenneCategory link = new AntenneCategory();
                    link.setAntenne(a);
                    link.setCategory(c);
                    antenneCatRepo.save(link);
                }
            }
        }
        log.info("✅ Affiliations catégories/antennes initialisées");

        log.info("🚀 Plateforme CIRT-ANTIC prête. Connectez-vous avec le super administrateur pour créer le directeur CIRT.");
    }

    private Role ensureRole(String name) {
        return roleRepo.findByName(name).orElseGet(() -> {
            Role r = new Role(); r.setName(name); return roleRepo.save(r);
        });
    }

    private SousDirection ensureSousDirection(String name) {
        return sousDirectionRepo.findAll().stream()
            .filter(sd -> sd.getName().equalsIgnoreCase(name)).findFirst()
            .orElseGet(() -> { SousDirection sd = new SousDirection(); sd.setName(name); return sousDirectionRepo.save(sd); });
    }

    private ServiceCirt ensureService(String name, SousDirection sd) {
        return serviceCirtRepo.findAll().stream()
            .filter(s -> s.getName().equalsIgnoreCase(name)).findFirst()
            .orElseGet(() -> { ServiceCirt s = new ServiceCirt(); s.setName(name); s.setSousDirection(sd); return serviceCirtRepo.save(s); });
    }

    private Antenne ensureAntenne(String name) {
        return antenneRepo.findAll().stream()
            .filter(a -> a.getName().equalsIgnoreCase(name)).findFirst()
            .orElseGet(() -> { Antenne a = new Antenne(); a.setName(name); return antenneRepo.save(a); });
    }

    private Category ensureCategory(String name, User createdBy) {
        return categoryRepo.findAll().stream()
            .filter(c -> c.getName().equalsIgnoreCase(name)).findFirst()
            .orElseGet(() -> { Category c = new Category(); c.setName(name); c.setCreatedBy(createdBy); return categoryRepo.save(c); });
    }
}
