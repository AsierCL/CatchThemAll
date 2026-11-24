package usc.enser.CatchThemAll.service.implementation;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import usc.enser.CatchThemAll.persistence.entities.Captures;
import usc.enser.CatchThemAll.persistence.repositories.CaptureRepository;
import usc.enser.CatchThemAll.persistence.repositories.FamousRepository;
import usc.enser.CatchThemAll.persistence.repositories.UserRepository;
import usc.enser.CatchThemAll.service.interfaces.IScoreService;

import java.util.UUID;

@Service
public class ScoreServiceImpl implements IScoreService {

    private final FamousRepository famousRepository;
    private final UserRepository userRepository;
    private final CaptureRepository captureRepository;

    public ScoreServiceImpl(FamousRepository famousRepository, UserRepository userRepository, CaptureRepository captureRepository) {
        this.famousRepository = famousRepository;
        this.userRepository = userRepository;
        this.captureRepository = captureRepository;
    }

    @Transactional
    @CacheEvict(cacheNames = {"ranking", "famous", "captures"})
    public void finishFuture(String name, double similarity, UUID id, Captures capture){
        captureRepository.save(capture);
        updateScore(name, similarity, id);
    }

    private void updateScore(String name, double similarity, UUID id) {

        int points = famousRepository.findByName(name).map(famous ->
                switch (famous.getCategory()) {
                    case Legendary -> (int) (similarity * 1000);
                    case Epic -> (int) (similarity * 700);
                    case Rare -> (int) (similarity * 400);
                    case Common -> (int) (similarity * 100);
                }).orElse(0);

        userRepository.updateScore(id, points);
    }

}