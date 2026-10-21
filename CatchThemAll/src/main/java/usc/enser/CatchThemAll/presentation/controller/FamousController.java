package usc.enser.CatchThemAll.presentation.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import usc.enser.CatchThemAll.enums.FamousTypes;
import usc.enser.CatchThemAll.presentation.dto.FamousResponse;
import usc.enser.CatchThemAll.service.interfaces.IFamousService;

@RestController
@RequestMapping("/famous")
public class FamousController {

    private final IFamousService famousService;

    public FamousController(IFamousService famousService) {
        this.famousService = famousService;
    }

    @GetMapping
    public List<FamousResponse> findAll(@RequestParam(required = false) FamousTypes type) {
        return type == null ? famousService.findAll() : famousService.findByType(type);
    }

    @GetMapping("/{famousId}")
    public FamousResponse findById(@PathVariable UUID famousId) {
        return famousService.findById(famousId);
    }
}
