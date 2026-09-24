package usc.enser.CatchThemAll.persintence.entities;

import java.sql.Timestamp;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@Entity
@Table (name = "captures")
public class Captures {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID captureId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "famousId", nullable = false)
    private Famous famous;

    private Timestamp timestamp;

    //TODO
    //Acordar como manejar ubicaciones
    //private Location location;

    private String photo_url;

}
