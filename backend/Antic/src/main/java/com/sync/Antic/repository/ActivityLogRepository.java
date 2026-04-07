package com.sync.Antic.repository;

import com.sync.Antic.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByActorIdOrderByCreatedAtDesc(Long actorId);

    List<ActivityLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);

    List<ActivityLog> findByActionOrderByCreatedAtDesc(ActivityLog.ActionType action);

    @Query("SELECT l FROM ActivityLog l ORDER BY l.createdAt DESC")
    List<ActivityLog> findAllOrderByCreatedAtDesc();

    @Query("SELECT l FROM ActivityLog l WHERE l.createdAt BETWEEN :from AND :to ORDER BY l.createdAt DESC")
    List<ActivityLog> findByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT l FROM ActivityLog l WHERE l.actor.id = :actorId AND l.createdAt BETWEEN :from AND :to ORDER BY l.createdAt DESC")
    List<ActivityLog> findByActorAndDateRange(@Param("actorId") Long actorId,
                                               @Param("from") LocalDateTime from,
                                               @Param("to") LocalDateTime to);
}
