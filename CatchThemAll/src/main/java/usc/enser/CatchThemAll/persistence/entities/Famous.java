package usc.enser.CatchThemAll.persistence.entities;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import usc.enser.CatchThemAll.enums.FamousCategories;
import usc.enser.CatchThemAll.enums.FamousTypes;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "famous")
public class Famous {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID famousId;

    @Column(unique = true, nullable = false)
    private Integer pokedexNumber;

    @Column(unique = true, nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private FamousCategories category;

    @Enumerated(EnumType.STRING)
    private FamousTypes type;

}
