package usc.enser.CatchThemAll.persistence.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    private Long id;

    private Integer score;

    private String description;

    private String photo_url;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile", nullable = false)
    private User user;


}
