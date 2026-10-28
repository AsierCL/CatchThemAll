package usc.enser.CatchThemAll.service.implementation;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import usc.enser.CatchThemAll.enums.FamousCategories;
import usc.enser.CatchThemAll.enums.FamousTypes;
import usc.enser.CatchThemAll.exception.ApiException;
import usc.enser.CatchThemAll.persistence.entities.Famous;
import usc.enser.CatchThemAll.persistence.repositories.CaptureRepository;
import usc.enser.CatchThemAll.persistence.repositories.FamousCaptureStatistics;
import usc.enser.CatchThemAll.persistence.repositories.FamousRepository;
import usc.enser.CatchThemAll.presentation.dto.FamousResponse;
import usc.enser.CatchThemAll.service.interfaces.IFamousService;

@Service
@Transactional(readOnly = true)
public class FamousServiceImpl implements IFamousService {

    private final FamousRepository famousRepository;
    private final CaptureRepository captureRepository;

    public FamousServiceImpl(FamousRepository famousRepository, CaptureRepository captureRepository) {
        this.famousRepository = famousRepository;
        this.captureRepository = captureRepository;
    }

    @Override
    //Podemos usar specification si hay muchos parámetros
    public List<FamousResponse> findAll(FamousTypes type, FamousCategories category) {

        if(type != null && category != null){
            return withStatistics(famousRepository.findByTypeAndCategoryOrderByPokedexNumberAsc(type,category));
        }else if(type != null){
            return withStatistics(famousRepository.findByTypeOrderByPokedexNumberAsc(type));
        }else if(category != null){
            return withStatistics(famousRepository.findByCategoryOrderByPokedexNumberAsc(category));
        }else{
            return withStatistics(famousRepository.findAll());
        }

        //return withStatistics(famousRepository.findAllByOrderByPokedexNumberAsc());
    }

    /*@Override
    public List<FamousResponse> findByType(FamousTypes type) {
        return withStatistics(famousRepository.findByTypeOrderByPokedexNumberAsc(type));
    }*/

    @Override
    public FamousResponse findById(UUID famousId) {
        Famous famous = famousRepository.findById(famousId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "famous not found"));
        FamousCaptureStatistics statistics = captureRepository.findCaptureStatisticsByFamousId(famousId)
                .orElse(null);
        return toResponse(famous, statistics);
    }

    private List<FamousResponse> withStatistics(List<Famous> famous) {
        if (famous.isEmpty()) {
            return List.of();
        }

        Map<UUID, FamousCaptureStatistics> statisticsByFamousId = captureRepository.findCaptureStatisticsForAll()
                .stream()
                .collect(Collectors.toMap(FamousCaptureStatistics::getFamousId, Function.identity()));

        return famous.stream()
                .map(item -> toResponse(item, statisticsByFamousId.get(item.getFamousId())))
                .toList();
    }

    private FamousResponse toResponse(Famous famous, FamousCaptureStatistics statistics) {
        return new FamousResponse(
                famous.getFamousId(),
                famous.getPokedexNumber(),
                famous.getName(),
                famous.getCategory(),
                famous.getType(),
                statistics == null ? 0L : statistics.getCaptureCount(),
                statistics == null ? 0L : statistics.getCollectorCount());
    }
}
