/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.sync.Antic.entity;

/**
 *
 * @author berna
 */
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDateTime;

public class DossierSpecification {

    public static Specification<Dossier> hasAntenne(Long antenneId) {
        return (root, query, cb) ->
                antenneId == null ? null :
                cb.equal(root.get("antenne").get("id"), antenneId);
    }

    public static Specification<Dossier> hasCategory(Long categoryId) {
        return (root, query, cb) ->
                categoryId == null ? null :
                cb.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Dossier> hasStatus(Status status) {
        return (root, query, cb) ->
                status == null ? null :
                cb.equal(root.get("status"), status);
    }

    public static Specification<Dossier> createdAfter(LocalDateTime date) {
        return (root, query, cb) ->
                date == null ? null :
                cb.greaterThanOrEqualTo(root.get("createdAt"), date);
    }

    public static Specification<Dossier> createdBefore(LocalDateTime date) {
        return (root, query, cb) ->
                date == null ? null :
                cb.lessThanOrEqualTo(root.get("createdAt"), date);
    }
}
