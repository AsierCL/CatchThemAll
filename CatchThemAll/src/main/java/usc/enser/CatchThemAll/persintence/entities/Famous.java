package usc.enser.CatchThemAll.persintence.entities;

import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import usc.enser.CatchThemAll.enums.FamousCategories;
import usc.enser.CatchThemAll.enums.FamousTypes;

@Getter
@Setter
@AllArgsConstructor
@Entity
@Table(name = "famous")
public class Famous {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID famousId;

    private Integer pokedexNumber;

    private String name;

    @Enumerated(EnumType.STRING)
    private FamousCategories category;

    @Enumerated(EnumType.STRING)
    private FamousTypes type;

}
