from .generated import capture_pb2_grpc
from .service import CaptureService
import grpc
import psycopg2
from pgvector.psycopg2 import register_vector
from insightface.app import FaceAnalysis
from concurrent import futures

def server():
    app = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"]
        )
    app.prepare(ctx_id=-1, det_size=(640, 640))
    conexion = psycopg2.connect(
            database="catchthemall",
            user="usuario",
            password="password123",
            host="localhost",
            port="7777"
    )
    conexion.autocommit = True
    register_vector(conexion)
    cursor = conexion.cursor()

    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS face_embeddings (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            embedding VECTOR(512)
        )
    """)

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    capture_pb2_grpc.add_CaptureServiceServicer_to_server(
        CaptureService(app,cursor),
        server,
    )
    listen_addr = "[::]:9090"
    server.add_insecure_port(listen_addr)
    print(f"Starting server on {listen_addr}")
    server.start()
    server.wait_for_termination()
    cursor.close()
    conexion.close()

if __name__ == "__main__":
    server()