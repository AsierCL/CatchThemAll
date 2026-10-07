from .generated import capture_pb2,capture_pb2_grpc
from .service import CaptureService
import grpc
from concurrent import futures

def server():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    capture_pb2_grpc.add_CaptureServiceServicer_to_server(
        CaptureService(),
        server,
    )
    listen_addr = "localhost:9090"
    server.add_insecure_port(listen_addr)
    print(f"Starting server on {listen_addr}")
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    server()