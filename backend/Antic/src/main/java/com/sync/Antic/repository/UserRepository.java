/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.sync.Antic.repository;

import com.sync.Antic.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 *
 * @author berna
 */
public interface UserRepository extends JpaRepository<User,Long>{

    Optional<User> findByUsername(String username);

}
