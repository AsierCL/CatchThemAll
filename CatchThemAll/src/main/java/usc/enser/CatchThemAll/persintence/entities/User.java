package usc.enser.CatchThemAll.persintence.entities;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 64)
    private String name;

    @Column(nullable = false)
    private String passwordHash;

    private String photo_url;

    private Integer score;

    private String description;

    @OneToMany(
        mappedBy = "user",
        cascade = CascadeType.MERGE,
        orphanRemoval = true
    )
    private List<Captures> captures = new ArrayList<>();

    @ManyToMany
    @JoinTable (
        name = "friends",
        joinColumns = @JoinColumn (name = "userId"),
        inverseJoinColumns = @JoinColumn (name = "friendId")
    )
    private Set<User> friends = new HashSet<>();
}
