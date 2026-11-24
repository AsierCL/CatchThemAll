package usc.enser.CatchThemAll.service.implementation;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    @Cacheable(cacheNames = "famous", key = "#type + '-' + #category", unless = "#result == null")
    public Page<FamousResponse> findAll(FamousTypes type, FamousCategories category, Pageable pageable) {

        if(type != null && category != null){
            return withStatistics(famousRepository.findByTypeAndCategoryOrderByPokedexNumberAsc(type,category, pageable));
        }else if(type != null){
            return withStatistics(famousRepository.findByTypeOrderByPokedexNumberAsc(type, pageable));
        }else if(category != null){
            return withStatistics(famousRepository.findByCategoryOrderByPokedexNumberAsc(category,pageable));
        }else{
            return withStatistics(famousRepository.findAllByOrderByPokedexNumberAsc(pageable));
        }

    }

    @Override
    @Cacheable(cacheNames = "famous")
    public FamousResponse findById(UUID famousId) {
        Famous famous = famousRepository.findById(famousId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "famous not found"));
        FamousCaptureStatistics statistics = captureRepository.findCaptureStatisticsByFamousId(famousId)
                .orElse(null);
        return toResponse(famous, statistics);
    }

    private Page<FamousResponse> withStatistics(Page<Famous> famous) {
        if (famous.isEmpty()) {
            return Page.empty(famous.getPageable());
        }

        Map<UUID, FamousCaptureStatistics> statisticsByFamousId = captureRepository.findCaptureStatisticsForAll()
                .stream()
                .collect(Collectors.toMap(FamousCaptureStatistics::getFamousId, Function.identity()));

        return famous.map(item -> toResponse(item, statisticsByFamousId.get(item.getFamousId())));
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
