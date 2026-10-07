package usc.enser.CatchThemAll;

import com.example.grpc.CaptureServiceGrpc;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.grpc.client.ImportGrpcClients;

@SpringBootApplication
@ImportGrpcClients(
    target = "localhost:9090",
    types = CaptureServiceGrpc.CaptureServiceFutureStub.class
)
public class CatchThemAllApplication {

	public static void main(String[] args) {
		SpringApplication.run(CatchThemAllApplication.class, args);
	}

}
