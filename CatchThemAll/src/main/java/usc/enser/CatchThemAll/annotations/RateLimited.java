package usc.enser.CatchThemAll.annotations;

import java.lang.annotation.*;
import java.time.temporal.ChronoUnit;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {
    long capacity() default 60;
    long duration() default 1;
    ChronoUnit unit() default ChronoUnit.MINUTES;
}