package usc.enser.CatchThemAll.persistence.entities;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 64)
    private String name;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private LocalDate birthDate;

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

    @OneToOne(
            mappedBy = "user",
            cascade = CascadeType.MERGE,
            orphanRemoval = true
    )
    private Profile profile;
}
