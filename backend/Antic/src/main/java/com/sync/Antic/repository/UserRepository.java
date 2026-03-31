package com.sync.Antic.repository;

import com.sync.Antic.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findByAntenneId(Long antenneId);

    List<User> findByServiceId(Long serviceId);

    // ❌ findByRoleName()          → "roleName" n'existe pas sur User
    // ❌ findByAntenneIdAndRoleName() → idem
    // ✅ On utilise des @Query JPQL qui traversent la relation role.name

    @Query("SELECT u FROM User u WHERE u.role.name = :roleName")
    List<User> findByRoleName(@Param("roleName") String roleName);

    @Query("SELECT u FROM User u WHERE u.antenne.id = :antenneId AND u.role.name = :roleName")
    List<User> findByAntenneIdAndRoleName(
        @Param("antenneId") Long antenneId,
        @Param("roleName") String roleName
    );

    @Query("SELECT u FROM User u WHERE u.service.sousDirection.id = :sdId")
    List<User> findBySousDirectionId(@Param("sdId") Long sousDirectionId);

    boolean existsByEmail(String email);
}
